package com.trustescrow.domain.service;

import com.trustescrow.domain.model.DealState;
import lombok.Getter;

import java.util.Map;
import java.util.Set;

/**
 * Server-authoritative state machine for Deal state transitions.
 * Validates transitions strictly according to SSOT rules.
 */
public class StateMachine {
    
    private static final Map<DealState, Set<DealState>> ALLOWED_TRANSITIONS = Map.of(
        DealState.CREATED, Set.of(DealState.FUNDED),
        DealState.FUNDED, Set.of(DealState.DELIVERED),
        DealState.DELIVERED, Set.of(DealState.INSPECTION),
        DealState.INSPECTION, Set.of(DealState.APPROVED, DealState.ISSUE),
        DealState.ISSUE, Set.of(DealState.SETTLED),
        DealState.APPROVED, Set.of(DealState.SETTLED)
    );
    
    /**
     * Validates if transition from currentState to newState is allowed.
     * 
     * @param currentState current state
     * @param newState desired new state
     * @return true if transition is allowed
     */
    public static boolean isTransitionAllowed(DealState currentState, DealState newState) {
        if (currentState == DealState.SETTLED) {
            return false; // Terminal state
        }
        
        Set<DealState> allowed = ALLOWED_TRANSITIONS.get(currentState);
        return allowed != null && allowed.contains(newState);
    }
    
    /**
     * Validates transition and throws exception if invalid.
     * 
     * @param currentState current state
     * @param newState desired new state
     * @throws IllegalStateTransitionException if transition is not allowed
     */
    public static void validateTransition(DealState currentState, DealState newState) {
        if (!isTransitionAllowed(currentState, newState)) {
            throw new IllegalStateTransitionException(
                String.format("Transition from %s to %s is not allowed", currentState, newState)
            );
        }
    }
    
    @Getter
    public static class IllegalStateTransitionException extends RuntimeException {
        public IllegalStateTransitionException(String message) {
            super(message);
        }
    }
}
