package com.trustescrow.domain.rules;

import com.trustescrow.domain.model.DealState;
import com.trustescrow.domain.model.IssueReasonCode;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class RulesEngineTest {
    
    @Test
    void testAutoApproveEvaluation() {
        RulesEngine.RulesEvaluationContext context = RulesEngine.RulesEvaluationContext.builder()
            .dealState(DealState.INSPECTION)
            .template(RulesEngine.ContractTemplateData.builder()
                .defaultResolutionOnDisputeTTL("releaseHoldbackMinusMinorCap")
                .offsetCapsByReasonCode(new HashMap<>())
                .build())
            .holdbackAmount(new BigDecimal("300"))
            .autoApproveElapsed(true)
            .disputeTTLElapsed(false)
            .holdbackUnreleased(true)
            .dispute(null)
            .build();
        
        RulesEngine.RulesEvaluationResult result = RulesEngine.evaluate(context);
        
        assertEquals(DealState.APPROVED, result.getNextState());
        assertFalse(result.getActions().isEmpty());
    }
    
    @Test
    void testDisputeTTLEvaluation() {
        RulesEngine.DisputeCaseData dispute = RulesEngine.DisputeCaseData.builder()
            .id(UUID.randomUUID())
            .reasonCode(IssueReasonCode.DAMAGE_MINOR)
            .build();
        
        RulesEngine.RulesEvaluationContext context = RulesEngine.RulesEvaluationContext.builder()
            .dealState(DealState.ISSUE)
            .template(RulesEngine.ContractTemplateData.builder()
                .defaultResolutionOnDisputeTTL("releaseHoldbackMinusMinorCap")
                .offsetCapsByReasonCode(new HashMap<>())
                .build())
            .holdbackAmount(new BigDecimal("300"))
            .autoApproveElapsed(false)
            .disputeTTLElapsed(true)
            .holdbackUnreleased(true)
            .dispute(dispute)
            .build();
        
        RulesEngine.RulesEvaluationResult result = RulesEngine.evaluate(context);
        
        assertEquals(DealState.SETTLED, result.getNextState());
        assertFalse(result.getActions().isEmpty());
    }
    
    @Test
    void testDeterminism() {
        RulesEngine.RulesEvaluationContext context = RulesEngine.RulesEvaluationContext.builder()
            .dealState(DealState.INSPECTION)
            .template(RulesEngine.ContractTemplateData.builder()
                .defaultResolutionOnDisputeTTL("releaseHoldbackMinusMinorCap")
                .offsetCapsByReasonCode(new HashMap<>())
                .build())
            .holdbackAmount(new BigDecimal("300"))
            .autoApproveElapsed(true)
            .disputeTTLElapsed(false)
            .holdbackUnreleased(true)
            .dispute(null)
            .build();
        
        RulesEngine.RulesEvaluationResult result1 = RulesEngine.evaluate(context);
        RulesEngine.RulesEvaluationResult result2 = RulesEngine.evaluate(context);
        
        assertEquals(result1.getNextState(), result2.getNextState());
        assertEquals(result1.getActions().size(), result2.getActions().size());
    }
}
