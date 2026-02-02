package com.trustescrow.domain.service;

import com.trustescrow.domain.model.AuditEvent;
import com.trustescrow.domain.model.AuditEventType;
import com.trustescrow.domain.model.DisputeCase;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Service for admin operations.
 * Admin actions are constrained and must be auditable.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AdminService {
    
    private final DisputeCaseRepository disputeRepository;
    private final DealRepository dealRepository;
    private final AuditEventRepository auditEventRepository;
    private final RulesEngineService rulesEngineService;
    
    /**
     * Lists disputes, optionally filtered by status.
     */
    @Transactional(readOnly = true)
    public List<DisputeCase> listDisputes(DisputeCase.DisputeStatus status) {
        if (status != null) {
            return disputeRepository.findByStatus(status);
        }
        return disputeRepository.findAll();
    }
    
    /**
     * Resolves a dispute.
     * Admin must choose from rule-allowed outcomes.
     * Returns rules evaluation result per SSOT requirement.
     */
    @Transactional
    public com.trustescrow.domain.rules.RulesEngine.RulesEvaluationResult resolveDispute(UUID disputeId, String outcome, UUID adminId) {
        DisputeCase dispute = disputeRepository.findById(disputeId)
            .orElseThrow(() -> new IllegalArgumentException("Dispute not found: " + disputeId));
        
        if (dispute.getStatus() != DisputeCase.DisputeStatus.OPEN) {
            throw new IllegalStateException("Dispute is not open");
        }
        
        // Mark dispute as resolved
        dispute.markResolved(outcome, adminId);
        disputeRepository.save(dispute);
        
        // Evaluate rules to settle the deal
        var result = rulesEngineService.evaluateAndExecute(dispute.getDealId(), adminId.toString());
        
        // Emit audit event
        AuditEvent event = AuditEvent.builder()
            .dealId(dispute.getDealId())
            .type(AuditEventType.DISPUTE_RESOLVED)
            .actor(adminId.toString())
            .payload(String.format("{\"disputeId\":\"%s\",\"outcome\":\"%s\"}", disputeId, outcome))
            .createdAt(Instant.now())
            .build();
        auditEventRepository.save(event);
        
        return result;
    }
    
    /**
     * Admin override for rare cases.
     * Must be fully auditable.
     */
    @Transactional
    public void overrideDeal(UUID dealId, String reason, String explanation, UUID adminId) {
        // Emit audit event for override
        AuditEvent event = AuditEvent.builder()
            .dealId(dealId)
            .type(AuditEventType.ADMIN_OVERRIDE)
            .actor(adminId.toString())
            .payload(String.format("{\"reason\":\"%s\",\"explanation\":\"%s\"}", reason, explanation))
            .createdAt(Instant.now())
            .build();
        auditEventRepository.save(event);
        
        log.warn("Admin override executed on deal {} by {}: {}", dealId, adminId, explanation);
    }
}
