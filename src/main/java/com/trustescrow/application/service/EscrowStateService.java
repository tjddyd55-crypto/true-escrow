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
     * STEP 4: Added RELEASE_REQUESTED status.
     */
    public static class MilestoneState {
        private String status; // "PENDING" | "PAID_HELD" | "FUNDED" | "RELEASE_REQUESTED" | "RELEASED" | "REFUNDED"
        
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
     * STEP 2: Set milestone status to PAID_HELD (escrow hold).
     * Only transitions from PENDING to PAID_HELD.
     */
    public void setMilestonePaidHeld(String dealId, String milestoneId) {
        log.info("===== STEP 2: MILESTONE STATE TRANSITION =====");
        log.info("dealId: {}, milestoneId: {}", dealId, milestoneId);
        log.info("Target state: PAID_HELD (from PENDING)");
        
        STATE_STORAGE.computeIfAbsent(dealId, k -> {
            log.info("Creating new state entry for deal: {}", dealId);
            return new ConcurrentHashMap<>();
        }).compute(milestoneId, (key, existing) -> {
            if (existing == null) {
                log.info("Milestone {} for deal {} set to PAID_HELD (from PENDING - new entry)", milestoneId, dealId);
                log.info("===== STEP 2: STATE TRANSITION SUCCESS =====");
                return new MilestoneState("PAID_HELD");
            } else {
                String currentStatus = existing.getStatus();
                log.info("Current milestone status: {}", currentStatus);
                
                if ("PENDING".equals(currentStatus)) {
                    log.info("Milestone {} for deal {} transitioned from PENDING to PAID_HELD", milestoneId, dealId);
                    existing.setStatus("PAID_HELD");
                    log.info("===== STEP 2: STATE TRANSITION SUCCESS =====");
                    return existing;
                } else if ("PAID_HELD".equals(currentStatus)) {
                    log.info("Milestone {} for deal {} already in PAID_HELD state, skipping", milestoneId, dealId);
                    log.info("===== STEP 2: STATE ALREADY PAID_HELD (SKIP) =====");
                    return existing;
                } else {
                    log.warn("Milestone {} for deal {} is in state {}, cannot transition to PAID_HELD", 
                        milestoneId, dealId, currentStatus);
                    log.warn("===== STEP 2: STATE TRANSITION BLOCKED =====");
                    return existing;
                }
            }
        });
    }
    
    /**
     * STEP 2: Set milestone status to REFUNDED.
     * Only transitions from PAID_HELD to REFUNDED.
     */
    public void setMilestoneRefunded(String dealId, String milestoneId) {
        log.info("===== STEP 2: MILESTONE REFUND TRANSITION =====");
        log.info("dealId: {}, milestoneId: {}", dealId, milestoneId);
        
        STATE_STORAGE.computeIfAbsent(dealId, k -> new ConcurrentHashMap<>())
            .compute(milestoneId, (key, existing) -> {
                if (existing == null) {
                    log.warn("Milestone {} for deal {} not found, cannot refund", milestoneId, dealId);
                    return new MilestoneState("REFUNDED");
                } else {
                    String currentStatus = existing.getStatus();
                    if ("PAID_HELD".equals(currentStatus)) {
                        log.info("Milestone {} for deal {} transitioned from PAID_HELD to REFUNDED", milestoneId, dealId);
                        existing.setStatus("REFUNDED");
                        return existing;
                    } else {
                        log.warn("Milestone {} for deal {} is in state {}, cannot refund", 
                            milestoneId, dealId, currentStatus);
                        return existing;
                    }
                }
            });
    }
    
    /**
     * STEP 4: Set milestone status to RELEASE_REQUESTED.
     * Only transitions from PAID_HELD/FUNDS_HELD to RELEASE_REQUESTED.
     */
    public void setMilestoneReleaseRequested(String dealId, String milestoneId) {
        log.info("[ESCROW] Release request: dealId={}, milestoneId={}", dealId, milestoneId);
        
        STATE_STORAGE.computeIfAbsent(dealId, k -> new ConcurrentHashMap<>())
            .compute(milestoneId, (key, existing) -> {
                if (existing == null) {
                    log.warn("[ESCROW] Milestone {} for deal {} not found, creating RELEASE_REQUESTED", milestoneId, dealId);
                    return new MilestoneState("RELEASE_REQUESTED");
                } else {
                    String currentStatus = existing.getStatus();
                    if ("PAID_HELD".equals(currentStatus) || "FUNDS_HELD".equals(currentStatus)) {
                        log.info("[ESCROW] Milestone {} for deal {} transitioned from {} to RELEASE_REQUESTED", 
                            milestoneId, dealId, currentStatus);
                        existing.setStatus("RELEASE_REQUESTED");
                        return existing;
                    } else {
                        log.warn("[ESCROW] Milestone {} for deal {} is in state {}, cannot request release", 
                            milestoneId, dealId, currentStatus);
                        return existing;
                    }
                }
            });
    }
    
    /**
     * STEP 4: Set milestone status to RELEASED (admin approval).
     * Only transitions from RELEASE_REQUESTED to RELEASED.
     */
    public void setMilestoneReleased(String dealId, String milestoneId) {
        log.info("[ESCROW] Release approval: dealId={}, milestoneId={}", dealId, milestoneId);
        
        STATE_STORAGE.computeIfAbsent(dealId, k -> new ConcurrentHashMap<>())
            .compute(milestoneId, (key, existing) -> {
                if (existing == null) {
                    log.warn("[ESCROW] Milestone {} for deal {} not found, cannot release", milestoneId, dealId);
                    return null;
                } else {
                    String currentStatus = existing.getStatus();
                    if ("RELEASE_REQUESTED".equals(currentStatus)) {
                        log.info("[ESCROW] Milestone {} for deal {} transitioned from RELEASE_REQUESTED to RELEASED", 
                            milestoneId, dealId);
                        existing.setStatus("RELEASED");
                        return existing;
                    } else {
                        log.warn("[ESCROW] Milestone {} for deal {} is in state {}, cannot release (must be RELEASE_REQUESTED)", 
                            milestoneId, dealId, currentStatus);
                        return existing;
                    }
                }
            });
    }
    
    /**
     * STEP 6: Set milestone status to DISPUTED.
     * Only transitions from PAID_HELD or RELEASE_REQUESTED to DISPUTED.
     */
    public void setMilestoneDisputed(String dealId, String milestoneId) {
        log.info("[ESCROW] Dispute raised: dealId={}, milestoneId={}", dealId, milestoneId);
        
        STATE_STORAGE.computeIfAbsent(dealId, k -> new ConcurrentHashMap<>())
            .compute(milestoneId, (key, existing) -> {
                if (existing == null) {
                    log.warn("[ESCROW] Milestone {} for deal {} not found, creating DISPUTED", milestoneId, dealId);
                    return new MilestoneState("DISPUTED");
                } else {
                    String currentStatus = existing.getStatus();
                    if ("PAID_HELD".equals(currentStatus) || "RELEASE_REQUESTED".equals(currentStatus)) {
                        log.info("[ESCROW] Milestone {} for deal {} transitioned from {} to DISPUTED", 
                            milestoneId, dealId, currentStatus);
                        existing.setStatus("DISPUTED");
                        return existing;
                    } else {
                        log.warn("[ESCROW] Milestone {} for deal {} is in state {}, cannot dispute", 
                            milestoneId, dealId, currentStatus);
                        return existing;
                    }
                }
            });
    }
    
    /**
     * Legacy method for backward compatibility.
     */
    @Deprecated
    public void setMilestoneFunded(String dealId, String milestoneId) {
        setMilestonePaidHeld(dealId, milestoneId);
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
