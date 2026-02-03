package com.trustescrow.domain.model;

/**
 * STEP 2: Deal state for escrow flow.
 * 
 * Escrow-specific states:
 * - CREATED: Deal created, no funds yet
 * - FUNDS_HELD: First milestone paid, funds held in escrow
 * - IN_PROGRESS: Work/service in progress
 * - COMPLETED: Deal completed, all milestones released
 * - CANCELLED: Deal cancelled
 * 
 * Legacy states (for backward compatibility):
 * - FUNDED: Equivalent to FUNDS_HELD
 * - DELIVERED: Item/service delivered
 * - INSPECTION: Under inspection
 * - APPROVED: Approved by buyer
 * - ISSUE: Dispute/issue raised
 * - SETTLED: Settled (legacy)
 */
public enum DealState {
    CREATED,
    FUNDS_HELD,     // STEP 2: First milestone paid, funds held
    IN_PROGRESS,    // STEP 2: Work in progress
    COMPLETED,      // STEP 2: All milestones released
    CANCELLED,      // STEP 2: Deal cancelled
    // Legacy states (for backward compatibility)
    FUNDED,         // Legacy: Equivalent to FUNDS_HELD
    DELIVERED,      // Legacy
    INSPECTION,     // Legacy
    APPROVED,       // Legacy
    ISSUE,          // Legacy
    SETTLED         // Legacy
}
