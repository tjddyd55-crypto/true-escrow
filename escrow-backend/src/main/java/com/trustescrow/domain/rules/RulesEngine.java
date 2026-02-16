package com.trustescrow.domain.rules;

import com.trustescrow.domain.model.*;
import lombok.Builder;
import lombok.Value;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Pure function Rules Engine.
 * Takes deal context and returns actions to be executed.
 * Does not perform side effects.
 */
public class RulesEngine {
    
    /**
     * Evaluates rules for a deal and returns actions.
     * 
     * @param context deal evaluation context
     * @return evaluation result with actions
     */
    public static RulesEvaluationResult evaluate(RulesEvaluationContext context) {
        List<EscrowAction> actions = new ArrayList<>();
        List<String> notifications = new ArrayList<>();
        List<AuditEventDescription> auditEvents = new ArrayList<>();
        DealState nextState = null;
        
        DealState currentState = context.dealState;
        ContractTemplateData template = context.template;
        boolean autoApproveElapsed = context.autoApproveElapsed;
        boolean disputeTTLElapsed = context.disputeTTLElapsed;
        DisputeCaseData dispute = context.dispute;
        
        // State-specific rule evaluation
        if (currentState == DealState.INSPECTION) {
            if (autoApproveElapsed) {
                nextState = DealState.APPROVED;
                actions.add(EscrowAction.builder()
                    .type(EscrowActionType.RELEASE)
                    .amount(context.holdbackAmount)
                    .fromAccount("escrow")
                    .toAccount("seller")
                    .build());
                auditEvents.add(AuditEventDescription.builder()
                    .type(AuditEventType.RULES_EVALUATION)
                    .description("Auto-approve timer elapsed, moving to APPROVED")
                    .build());
            }
        } else if (currentState == DealState.APPROVED) {
            // Release holdback if not already released
            if (context.holdbackUnreleased) {
                actions.add(EscrowAction.builder()
                    .type(EscrowActionType.RELEASE)
                    .amount(context.holdbackAmount)
                    .fromAccount("escrow")
                    .toAccount("seller")
                    .build());
                nextState = DealState.SETTLED;
                auditEvents.add(AuditEventDescription.builder()
                    .type(AuditEventType.RULES_EVALUATION)
                    .description("Holdback released, moving to SETTLED")
                    .build());
            }
        } else if (currentState == DealState.ISSUE) {
            if (disputeTTLElapsed && dispute != null) {
                // Apply default resolution from template
                String defaultResolution = template.defaultResolutionOnDisputeTTL;
                nextState = DealState.SETTLED;
                
                if ("releaseHoldbackMinusMinorCap".equals(defaultResolution)) {
                    BigDecimal offsetAmount = calculateOffset(context, dispute, template);
                    if (offsetAmount.compareTo(BigDecimal.ZERO) > 0) {
                        actions.add(EscrowAction.builder()
                            .type(EscrowActionType.OFFSET)
                            .amount(offsetAmount)
                            .fromAccount("escrow")
                            .toAccount("buyer")
                            .referenceId(dispute.id)
                            .build());
                    }
                    
                    BigDecimal remaining = context.holdbackAmount.subtract(offsetAmount);
                    if (remaining.compareTo(BigDecimal.ZERO) > 0) {
                        actions.add(EscrowAction.builder()
                            .type(EscrowActionType.RELEASE)
                            .amount(remaining)
                            .fromAccount("escrow")
                            .toAccount("seller")
                            .build());
                    }
                }
                
                auditEvents.add(AuditEventDescription.builder()
                    .type(AuditEventType.RULES_EVALUATION)
                    .description("Dispute TTL elapsed, applying default resolution: " + defaultResolution)
                    .build());
            }
        }
        
        return RulesEvaluationResult.builder()
            .nextState(nextState)
            .actions(actions)
            .notifications(notifications)
            .auditEvents(auditEvents)
            .build();
    }
    
    private static BigDecimal calculateOffset(
        RulesEvaluationContext context,
        DisputeCaseData dispute,
        ContractTemplateData template
    ) {
        // Calculate offset based on reason code and template policy
        IssueReasonCode reasonCode = dispute.reasonCode;
        BigDecimal holdbackAmount = context.holdbackAmount;
        
        // Get cap from template if available
        BigDecimal cap = template.offsetCapsByReasonCode.getOrDefault(reasonCode, holdbackAmount);
        
        // Return minimum of cap and holdback
        return cap.min(holdbackAmount);
    }
    
    @Value
    @Builder
    public static class RulesEvaluationContext {
        DealState dealState;
        ContractTemplateData template;
        BigDecimal holdbackAmount;
        boolean autoApproveElapsed;
        boolean disputeTTLElapsed;
        boolean holdbackUnreleased;
        DisputeCaseData dispute;
    }
    
    @Value
    @Builder
    public static class RulesEvaluationResult {
        DealState nextState;
        List<EscrowAction> actions;
        List<String> notifications;
        List<AuditEventDescription> auditEvents;
    }
    
    @Value
    @Builder
    public static class EscrowAction {
        EscrowActionType type;
        BigDecimal amount;
        String fromAccount;
        String toAccount;
        UUID referenceId;
    }
    
    public enum EscrowActionType {
        HOLD,
        RELEASE,
        REFUND,
        OFFSET
    }
    
    @Value
    @Builder
    public static class AuditEventDescription {
        AuditEventType type;
        String description;
        String payload; // optional JSON
    }
    
    @Value
    @Builder
    public static class ContractTemplateData {
        String defaultResolutionOnDisputeTTL;
        java.util.Map<IssueReasonCode, BigDecimal> offsetCapsByReasonCode;
    }
    
    @Value
    @Builder
    public static class DisputeCaseData {
        UUID id;
        IssueReasonCode reasonCode;
    }
}
