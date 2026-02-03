package com.trustescrow.application.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * In-memory escrow state service (temporary implementation).
 * 
 * Stores milestone status in memory:
 * - PENDING: Initial state
 * - FUNDED: Payment completed, funds held in escrow
 * - RELEASED: Funds released (not implemented yet)
 * 
 * ⚠️ This is a temporary implementation for proof of concept.
 * Production should use database persistence.
 */
@Service
@Slf4j
public class EscrowStateService {
    
    /**
     * In-memory state storage.
     * Structure: { dealId: { milestones: { milestoneId: { status: "PENDING" | "FUNDED" | "RELEASED" } } } }
     */
    private static final Map<String, Map<String, MilestoneState>> STATE_STORAGE = new ConcurrentHashMap<>();
    
    /**
     * Milestone state structure.
     */
    public static class MilestoneState {
        private String status; // "PENDING" | "FUNDED" | "RELEASED"
        
        public MilestoneState(String status) {
            this.status = status;
        }
        
        public String getStatus() {
            return status;
        }
        
        public void setStatus(String status) {
            this.status = status;
        }
    }
    
    /**
     * Get milestone status.
     * Returns "PENDING" if not found (default state).
     */
    public String getMilestoneStatus(String dealId, String milestoneId) {
        log.debug("===== STEP 2: GET MILESTONE STATUS =====");
        log.debug("dealId: {}, milestoneId: {}", dealId, milestoneId);
        
        Map<String, MilestoneState> dealState = STATE_STORAGE.get(dealId);
        if (dealState == null) {
            log.debug("Deal {} not found in state storage, returning PENDING (default)", dealId);
            return "PENDING"; // Default state
        }
        
        MilestoneState milestone = dealState.get(milestoneId);
        if (milestone == null) {
            log.debug("Milestone {} not found for deal {}, returning PENDING (default)", milestoneId, dealId);
            return "PENDING"; // Default state
        }
        
        String status = milestone.getStatus();
        log.debug("Found milestone status: {}", status);
        log.debug("========================================");
        return status;
    }
    
    /**
     * STEP 2: Set milestone status to FUNDED (escrow hold).
     * Only transitions from PENDING to FUNDED.
     * RELEASED is forbidden in this step.
     */
    public void setMilestoneFunded(String dealId, String milestoneId) {
        log.info("===== STEP 2: MILESTONE STATE TRANSITION =====");
        log.info("dealId: {}, milestoneId: {}", dealId, milestoneId);
        log.info("Target state: FUNDED (from PENDING)");
        
        STATE_STORAGE.computeIfAbsent(dealId, k -> {
            log.info("Creating new state entry for deal: {}", dealId);
            return new ConcurrentHashMap<>();
        }).compute(milestoneId, (key, existing) -> {
            if (existing == null) {
                log.info("Milestone {} for deal {} set to FUNDED (from PENDING - new entry)", milestoneId, dealId);
                log.info("===== STEP 2: STATE TRANSITION SUCCESS =====");
                return new MilestoneState("FUNDED");
            } else {
                String currentStatus = existing.getStatus();
                log.info("Current milestone status: {}", currentStatus);
                
                if ("PENDING".equals(currentStatus)) {
                    log.info("Milestone {} for deal {} transitioned from PENDING to FUNDED", milestoneId, dealId);
                    existing.setStatus("FUNDED");
                    log.info("===== STEP 2: STATE TRANSITION SUCCESS =====");
                    return existing;
                } else if ("FUNDED".equals(currentStatus)) {
                    log.info("Milestone {} for deal {} already in FUNDED state, skipping", milestoneId, dealId);
                    log.info("===== STEP 2: STATE ALREADY FUNDED (SKIP) =====");
                    return existing;
                } else {
                    log.warn("Milestone {} for deal {} is in state {}, cannot transition to FUNDED", 
                        milestoneId, dealId, currentStatus);
                    log.warn("===== STEP 2: STATE TRANSITION BLOCKED =====");
                    return existing;
                }
            }
        });
    }
    
    /**
     * Get all milestones for a deal.
     */
    public Map<String, MilestoneState> getDealMilestones(String dealId) {
        log.debug("===== STEP 2: GET DEAL MILESTONES =====");
        log.debug("dealId: {}", dealId);
        
        Map<String, MilestoneState> milestones = STATE_STORAGE.getOrDefault(dealId, new ConcurrentHashMap<>());
        log.debug("Found {} milestones for deal {}", milestones.size(), dealId);
        milestones.forEach((id, state) -> {
            log.debug("  - milestoneId: {}, status: {}", id, state.getStatus());
        });
        log.debug("=======================================");
        return milestones;
    }
}
