package com.trustescrow.domain.service;

import com.trustescrow.domain.model.DealState;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class StateMachineTest {
    
    @Test
    void testAllowedTransitions() {
        assertTrue(StateMachine.isTransitionAllowed(DealState.CREATED, DealState.FUNDED));
        assertTrue(StateMachine.isTransitionAllowed(DealState.FUNDED, DealState.DELIVERED));
        assertTrue(StateMachine.isTransitionAllowed(DealState.DELIVERED, DealState.INSPECTION));
        assertTrue(StateMachine.isTransitionAllowed(DealState.INSPECTION, DealState.APPROVED));
        assertTrue(StateMachine.isTransitionAllowed(DealState.INSPECTION, DealState.ISSUE));
        assertTrue(StateMachine.isTransitionAllowed(DealState.ISSUE, DealState.SETTLED));
        assertTrue(StateMachine.isTransitionAllowed(DealState.APPROVED, DealState.SETTLED));
    }
    
    @Test
    void testIllegalTransitions() {
        assertFalse(StateMachine.isTransitionAllowed(DealState.CREATED, DealState.DELIVERED));
        assertFalse(StateMachine.isTransitionAllowed(DealState.FUNDED, DealState.APPROVED));
        assertFalse(StateMachine.isTransitionAllowed(DealState.APPROVED, DealState.INSPECTION));
        assertFalse(StateMachine.isTransitionAllowed(DealState.SETTLED, DealState.APPROVED));
    }
    
    @Test
    void testValidateTransitionThrowsException() {
        assertThrows(StateMachine.IllegalStateTransitionException.class, () -> {
            StateMachine.validateTransition(DealState.CREATED, DealState.DELIVERED);
        });
    }
}
