package com.trustescrow.domain.service;

import com.trustescrow.domain.model.AuditEvent;
import com.trustescrow.domain.model.AuditEventType;
import com.trustescrow.domain.model.Deal;
import com.trustescrow.domain.model.DealState;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

/**
 * Service for managing Deal state transitions.
 * All transitions are server-authoritative and emit audit events.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class DealStateService {
    
    private final DealRepository dealRepository;
    private final AuditEventRepository auditEventRepository;
    
    /**
     * Transitions a deal to a new state.
     * Validates transition, updates deal, and emits audit event.
     * 
     * @param dealId deal ID
     * @param newState target state
     * @param actor user ID or "system"
     * @param payload optional JSON payload for audit
     */
    @Transactional
    public void transitionDeal(UUID dealId, DealState newState, String actor, String payload) {
        Deal deal = dealRepository.findById(dealId)
            .orElseThrow(() -> new IllegalArgumentException("Deal not found: " + dealId));
        
        DealState currentState = deal.getState();
        
        // Validate transition
        StateMachine.validateTransition(currentState, newState);
        
        // Update deal state
        deal.transitionTo(newState);
        
        // Handle state-specific logic
        if (newState == DealState.INSPECTION) {
            deal.markInspectionStarted();
        } else if (newState == DealState.ISSUE) {
            deal.markIssueRaised();
        }
        
        dealRepository.save(deal);
        
        // Emit audit event
        AuditEvent auditEvent = AuditEvent.builder()
            .dealId(dealId)
            .type(AuditEventType.STATE_TRANSITION)
            .actor(actor)
            .payload(payload != null ? payload : String.format(
                "{\"from\":\"%s\",\"to\":\"%s\"}", currentState, newState
            ))
            .createdAt(Instant.now())
            .build();
        
        auditEventRepository.save(auditEvent);
        
        log.info("Deal {} transitioned from {} to {} by {}", dealId, currentState, newState, actor);
    }
}
