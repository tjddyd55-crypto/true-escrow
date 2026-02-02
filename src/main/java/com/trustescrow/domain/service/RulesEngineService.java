package com.trustescrow.domain.service;

import com.trustescrow.domain.model.*;
import com.trustescrow.domain.rules.RulesEngine;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Service that orchestrates Rules Engine evaluation and action execution.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RulesEngineService {
    
    private final DealRepository dealRepository;
    private final ContractInstanceRepository instanceRepository;
    private final TimerService timerService;
    private final DisputeCaseRepository disputeRepository;
    private final EscrowLedgerService ledgerService;
    private final DealStateService stateService;
    private final AuditEventRepository auditEventRepository;
    private final TemplateParserService templateParserService;
    
    /**
     * Evaluates rules for a deal and executes resulting actions.
     * This is the main entry point for rule evaluation.
     */
    @Transactional
    public RulesEngine.RulesEvaluationResult evaluateAndExecute(UUID dealId, String actor) {
        Deal deal = dealRepository.findByIdWithLock(dealId)
            .orElseThrow(() -> new IllegalArgumentException("Deal not found: " + dealId));
        
        // Build evaluation context
        RulesEngine.RulesEvaluationContext context = buildContext(deal);
        
        // Evaluate rules (pure function)
        RulesEngine.RulesEvaluationResult result = RulesEngine.evaluate(context);
        
        // Execute actions
        if (result.getNextState() != null) {
            stateService.transitionDeal(dealId, result.getNextState(), actor, null);
        }
        
        // Execute escrow actions
        for (RulesEngine.EscrowAction action : result.getActions()) {
            ledgerService.executeAction(dealId, action, actor);
        }
        
        // Emit audit events
        for (RulesEngine.AuditEventDescription auditDesc : result.getAuditEvents()) {
            AuditEvent event = AuditEvent.builder()
                .dealId(dealId)
                .type(auditDesc.getType())
                .actor(actor)
                .payload(auditDesc.getPayload())
                .createdAt(java.time.Instant.now())
                .build();
            auditEventRepository.save(event);
        }
        
        return result;
    }
    
    private RulesEngine.RulesEvaluationContext buildContext(Deal deal) {
        ContractInstance instance = instanceRepository.findByDealId(deal.getId())
            .orElseThrow(() -> new IllegalStateException("Contract instance not found for deal: " + deal.getId()));
        
        // Check timers
        Timer autoApproveTimer = timerService.findActiveTimer(deal.getId(), "AUTO_APPROVE");
        boolean autoApproveElapsed = autoApproveTimer != null && autoApproveTimer.isElapsed();
        
        Timer disputeTTLTimer = timerService.findActiveTimer(deal.getId(), "DISPUTE_TTL");
        boolean disputeTTLElapsed = disputeTTLTimer != null && disputeTTLTimer.isElapsed();
        
        // Get dispute if exists
        RulesEngine.DisputeCaseData disputeData = null;
        if (deal.getState() == DealState.ISSUE || deal.getDisputeOpen() != null && deal.getDisputeOpen()) {
            DisputeCase dispute = disputeRepository.findByDealId(deal.getId())
                .orElse(null);
            if (dispute != null) {
                disputeData = RulesEngine.DisputeCaseData.builder()
                    .id(dispute.getId())
                    .reasonCode(dispute.getReasonCode())
                    .build();
            }
        }
        
        // Parse template data (Phase 4: proper JSON parsing with category-specific parameters)
        RulesEngine.ContractTemplateData templateData = templateParserService.parseTemplateData(instance.getSnapshotJson());
        
        // Check if holdback is unreleased
        boolean holdbackUnreleased = ledgerService.isHoldbackUnreleased(deal.getId(), deal.getHoldbackAmount());
        
        return RulesEngine.RulesEvaluationContext.builder()
            .dealState(deal.getState())
            .template(templateData)
            .holdbackAmount(deal.getHoldbackAmount())
            .autoApproveElapsed(autoApproveElapsed)
            .disputeTTLElapsed(disputeTTLElapsed)
            .holdbackUnreleased(holdbackUnreleased)
            .dispute(disputeData)
            .build();
    }
    
}
