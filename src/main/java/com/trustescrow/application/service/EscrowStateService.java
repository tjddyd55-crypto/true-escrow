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
        Map<String, MilestoneState> dealState = STATE_STORAGE.get(dealId);
        if (dealState == null) {
            return "PENDING"; // Default state
        }
        
        MilestoneState milestone = dealState.get(milestoneId);
        if (milestone == null) {
            return "PENDING"; // Default state
        }
        
        return milestone.getStatus();
    }
    
    /**
     * Set milestone status to FUNDED (escrow hold).
     * Only transitions from PENDING to FUNDED.
     */
    public void setMilestoneFunded(String dealId, String milestoneId) {
        STATE_STORAGE.computeIfAbsent(dealId, k -> new ConcurrentHashMap<>())
            .compute(milestoneId, (key, existing) -> {
                if (existing == null) {
                    log.info("Milestone {} for deal {} set to FUNDED (from PENDING)", milestoneId, dealId);
                    return new MilestoneState("FUNDED");
                } else if ("PENDING".equals(existing.getStatus())) {
                    log.info("Milestone {} for deal {} transitioned from PENDING to FUNDED", milestoneId, dealId);
                    existing.setStatus("FUNDED");
                    return existing;
                } else {
                    log.info("Milestone {} for deal {} already in state {}, skipping", 
                        milestoneId, dealId, existing.getStatus());
                    return existing;
                }
            });
    }
    
    /**
     * Get all milestones for a deal.
     */
    public Map<String, MilestoneState> getDealMilestones(String dealId) {
        return STATE_STORAGE.getOrDefault(dealId, new ConcurrentHashMap<>());
    }
}
