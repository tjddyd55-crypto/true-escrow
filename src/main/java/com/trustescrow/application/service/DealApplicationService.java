package com.trustescrow.application.service;

import com.trustescrow.application.dto.CreateDealRequest;
import com.trustescrow.application.dto.IssueRequest;
import com.trustescrow.domain.model.*;
import com.trustescrow.domain.service.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.Instant;
import java.util.UUID;

/**
 * Application service for Deal use cases.
 * Orchestrates domain services and enforces business rules.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class DealApplicationService {
    
    private final DealRepository dealRepository;
    private final ContractTemplateService contractTemplateService;
    private final DealStateService stateService;
    private final TimerService timerService;
    private final EvidenceService evidenceService;
    private final DisputeCaseRepository disputeRepository;
    private final RulesEngineService rulesEngineService;
    private final EscrowLedgerService ledgerService;
    private final AuditEventRepository auditEventRepository;
    private final ContractInstanceRepository instanceRepository;
    private final TemplateParserService templateParserService;
    private final PilotValidationService pilotValidationService;
    
    /**
     * Creates a new deal.
     */
    @Transactional
    public Deal createDeal(CreateDealRequest request, UUID actorId) {
        // Phase 6: Validate pilot deal creation (backend enforcement)
        // Extract country from request (if available) or use default
        // For now, we'll check category against pilot allowlist
        // TODO: Add country field to CreateDealRequest if needed
        String country = "MN"; // Default for pilot, should come from request in production
        pilotValidationService.validatePilotDealCreation(country, request.getCategory());
        
        // Get template version for pilot (if applicable)
        String templateVersion = pilotValidationService.getTemplateVersion();
        
        // Get latest template for category (or specific version if pilot)
        ContractTemplate template = contractTemplateService.getLatestTemplate(request.getCategory());
        
        // Extract monetary policy from template (category-specific)
        TemplateParserService.MonetaryPolicy monetaryPolicy = 
            templateParserService.extractMonetaryPolicy(template.getTemplateJson());
        
        // Calculate amounts based on template parameters
        BigDecimal immediateAmount = request.getTotalAmount()
            .multiply(BigDecimal.valueOf(monetaryPolicy.getImmediatePercent()))
            .divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
        BigDecimal holdbackAmount = request.getTotalAmount().subtract(immediateAmount);
        
        // Create deal
        Deal deal = Deal.builder()
            .buyerId(request.getBuyerId())
            .sellerId(request.getSellerId())
            .itemRef(request.getItemRef())
            .category(request.getCategory())
            .totalAmount(request.getTotalAmount())
            .immediateAmount(immediateAmount)
            .holdbackAmount(holdbackAmount)
            .currency(request.getCurrency())
            .state(DealState.CREATED)
            .createdAt(Instant.now())
            .updatedAt(Instant.now())
            .disputeOpen(false)
            .build();
        
        deal = dealRepository.save(deal);
        
        // Create contract instance (immutable snapshot)
        ContractInstance instance = contractTemplateService.createInstance(
            deal.getId(),
            template.getId(),
            template.getVersion(),
            template.getTemplateJson()
        );
        
        deal.setContractInstanceId(instance.getId());
        deal = dealRepository.save(deal);
        
        return deal;
    }
    
    /**
     * Funds a deal (moves from CREATED to FUNDED).
     */
    @Transactional
    public void fundDeal(UUID dealId, UUID actorId) {
        Deal deal = dealRepository.findById(dealId)
            .orElseThrow(() -> new IllegalArgumentException("Deal not found: " + dealId));
        
        if (deal.getState() != DealState.CREATED) {
            throw new IllegalStateException("Deal must be in CREATED state to fund");
        }
        
        // Transition to FUNDED
        stateService.transitionDeal(dealId, DealState.FUNDED, actorId.toString(), null);
        
        // Execute initial ledger actions: HOLD holdback, RELEASE immediate
        // Note: In real implementation, immediate might be held until delivery
        // For now, we'll hold both and release immediate at delivery
        ledgerService.executeAction(dealId, 
            com.trustescrow.domain.rules.RulesEngine.EscrowAction.builder()
                .type(com.trustescrow.domain.rules.RulesEngine.EscrowActionType.HOLD)
                .amount(deal.getHoldbackAmount())
                .fromAccount("buyer")
                .toAccount("escrow")
                .build(),
            actorId.toString());
        
        ledgerService.executeAction(dealId,
            com.trustescrow.domain.rules.RulesEngine.EscrowAction.builder()
                .type(com.trustescrow.domain.rules.RulesEngine.EscrowActionType.HOLD)
                .amount(deal.getImmediateAmount())
                .fromAccount("buyer")
                .toAccount("escrow")
                .build(),
            actorId.toString());
    }
    
    /**
     * Marks deal as delivered (moves from FUNDED to DELIVERED to INSPECTION).
     */
    @Transactional
    public void deliverDeal(UUID dealId, UUID actorId) {
        Deal deal = dealRepository.findById(dealId)
            .orElseThrow(() -> new IllegalArgumentException("Deal not found: " + dealId));
        
        if (deal.getState() != DealState.FUNDED) {
            throw new IllegalStateException("Deal must be in FUNDED state to deliver");
        }
        
        // Transition to DELIVERED, then immediately to INSPECTION
        stateService.transitionDeal(dealId, DealState.DELIVERED, actorId.toString(), null);
        stateService.transitionDeal(dealId, DealState.INSPECTION, actorId.toString(), null);
        
        // Release immediate amount to seller
        ledgerService.executeAction(dealId,
            com.trustescrow.domain.rules.RulesEngine.EscrowAction.builder()
                .type(com.trustescrow.domain.rules.RulesEngine.EscrowActionType.RELEASE)
                .amount(deal.getImmediateAmount())
                .fromAccount("escrow")
                .toAccount("seller")
                .build(),
            actorId.toString());
        
        // Get timer configuration from contract instance (category-specific)
        ContractInstance instance = instanceRepository.findByDealId(dealId)
            .orElseThrow(() -> new IllegalStateException("Contract instance not found"));
        TemplateParserService.TimerConfiguration timerConfig = 
            templateParserService.extractTimerConfiguration(instance.getSnapshotJson());
        
        // Create auto-approve timer with category-specific duration
        if (timerConfig.isAutoApproveEnabled()) {
            timerService.createTimer(dealId, "AUTO_APPROVE", timerConfig.getAutoApproveDuration());
        }
    }
    
    /**
     * Approves deal (moves from INSPECTION to APPROVED).
     * Returns rules evaluation result per SSOT requirement.
     */
    @Transactional
    public com.trustescrow.domain.rules.RulesEngine.RulesEvaluationResult approveDeal(UUID dealId, UUID actorId) {
        Deal deal = dealRepository.findById(dealId)
            .orElseThrow(() -> new IllegalArgumentException("Deal not found: " + dealId));
        
        if (deal.getState() != DealState.INSPECTION) {
            throw new IllegalStateException("Deal must be in INSPECTION state to approve");
        }
        
        // Transition to APPROVED
        stateService.transitionDeal(dealId, DealState.APPROVED, actorId.toString(), null);
        
        // Evaluate rules (will release holdback and move to SETTLED)
        return rulesEngineService.evaluateAndExecute(dealId, actorId.toString());
    }
    
    /**
     * Gets a deal by ID.
     */
    @Transactional(readOnly = true)
    public Deal getDeal(UUID dealId) {
        return dealRepository.findById(dealId)
            .orElseThrow(() -> new IllegalArgumentException("Deal not found: " + dealId));
    }
    
    /**
     * Raises an issue (moves from INSPECTION to ISSUE).
     */
    @Transactional
    public void raiseIssue(UUID dealId, IssueRequest request, UUID actorId) {
        Deal deal = dealRepository.findById(dealId)
            .orElseThrow(() -> new IllegalArgumentException("Deal not found: " + dealId));
        
        if (deal.getState() != DealState.INSPECTION) {
            throw new IllegalStateException("Deal must be in INSPECTION state to raise issue");
        }
        
        // Validate evidence requirement from template (category-specific)
        ContractInstance instance = instanceRepository.findByDealId(dealId)
            .orElseThrow(() -> new IllegalStateException("Contract instance not found"));
        boolean evidenceRequired = templateParserService.isEvidenceRequiredForIssue(instance.getSnapshotJson());
        
        if (evidenceRequired && request.getEvidenceIds().isEmpty()) {
            throw new IllegalArgumentException("Evidence is required for issue creation (template requirement)");
        }
        
        // Transition to ISSUE
        stateService.transitionDeal(dealId, DealState.ISSUE, actorId.toString(), null);
        
        // Create dispute case
        DisputeCase dispute = DisputeCase.builder()
            .dealId(dealId)
            .reasonCode(request.getReasonCode())
            .freeText(request.getFreeText())
            .status(DisputeCase.DisputeStatus.OPEN)
            .createdAt(Instant.now())
            .expiresAt(Instant.now().plus(Duration.ofDays(14))) // 14 days TTL
            .build();
        
        disputeRepository.save(dispute);
        
        // Emit audit event per SSOT: dispute lifecycle must produce audit events
        AuditEvent disputeOpenedEvent = AuditEvent.builder()
            .dealId(dealId)
            .type(AuditEventType.DISPUTE_OPENED)
            .actor(actorId.toString())
            .payload(String.format(
                "{\"disputeId\":\"%s\",\"reasonCode\":\"%s\",\"freeText\":\"%s\"}",
                dispute.getId(), request.getReasonCode(), request.getFreeText()
            ))
            .createdAt(Instant.now())
            .build();
        auditEventRepository.save(disputeOpenedEvent);
        
        // Get dispute TTL duration from template (category-specific, default 14 days)
        TemplateParserService.TimerConfiguration timerConfig = 
            templateParserService.extractTimerConfiguration(instance.getSnapshotJson());
        
        // Create dispute TTL timer with template-defined duration
        timerService.createTimer(dealId, "DISPUTE_TTL", timerConfig.getDisputeTTLDuration());
        
        // Mark deal as having dispute
        deal.setDisputeOpen(true);
        dealRepository.save(deal);
    }
}
