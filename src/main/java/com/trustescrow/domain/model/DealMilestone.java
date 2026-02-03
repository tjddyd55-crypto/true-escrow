package com.trustescrow.domain.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Deal milestone tracking.
 * Maximum 3 milestones per deal.
 */
@Entity
@Table(name = "deal_milestones", indexes = {
    @Index(name = "idx_deal_milestones_deal", columnList = "dealId,orderIndex")
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class DealMilestone {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(nullable = false)
    private UUID dealId;
    
    @Column(nullable = false)
    private Integer orderIndex; // 1, 2, or 3 (max 3 milestones)
    
    @Column(nullable = false)
    private String title;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal amount;
    
    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private MilestoneStatus status;
    
    @Column(nullable = false)
    private Instant createdAt;
    
    @Column(nullable = false)
    private Instant updatedAt;
    
    private Instant completedAt;
    
    /**
     * MASTER TASK: Milestone status for escrow flow with evidence and approval system.
     * 
     * Core states:
     * - PENDING: Initial state, payment not yet made
     * - FUNDS_HELD: Payment completed, funds held in escrow (alias: PAID_HELD)
     * - EVIDENCE_SUBMITTED: Evidence uploaded, milestone completion proof provided
     * - RELEASE_REQUESTED: Release request submitted (awaiting admin approval)
     * - RELEASED: Funds released to seller (admin approved)
     * - DISPUTED: Dispute raised
     * - REFUNDED: Payment refunded to buyer
     * 
     * State transitions (strict - no skipping):
     * - PENDING → FUNDS_HELD (via webhook/payment)
     * - FUNDS_HELD → EVIDENCE_SUBMITTED (via evidence upload)
     * - EVIDENCE_SUBMITTED → RELEASE_REQUESTED (via release request)
     * - RELEASE_REQUESTED → RELEASED (via admin approval)
     * - FUNDS_HELD / EVIDENCE_SUBMITTED / RELEASE_REQUESTED → DISPUTED (via dispute)
     * - DISPUTED → RELEASED or REFUNDED (via admin resolution)
     * 
     * Reverse transitions are NOT allowed:
     * - RELEASED → FUNDS_HELD ❌
     * - REFUNDED → RELEASED ❌
     * - EVIDENCE_SUBMITTED → FUNDS_HELD ❌
     * 
     * Legacy/alias statuses (for backward compatibility):
     * - PAID_HELD: Alias for FUNDS_HELD
     * - DISPUTE_REVIEWING: Admin reviewing dispute (internal state)
     * - DISPUTE_RESOLVED_RELEASE: Dispute resolved - release (internal state)
     * - DISPUTE_RESOLVED_REFUND: Dispute resolved - refund (internal state)
     * - IN_PROGRESS: Work in progress (legacy)
     * - COMPLETED: Work completed (legacy)
     * - REJECTED: Work rejected (legacy)
     */
    public enum MilestoneStatus {
        PENDING,                    // Initial state
        FUNDS_HELD,                 // MASTER: Payment completed, funds held
        PAID_HELD,                  // Alias for FUNDS_HELD (backward compatibility)
        EVIDENCE_SUBMITTED,         // MASTER: Evidence uploaded
        RELEASE_REQUESTED,          // Release request submitted
        RELEASED,                   // Funds released (admin approved)
        DISPUTED,                   // Dispute raised
        REFUNDED,                   // Payment refunded
        DISPUTE_REVIEWING,          // Admin reviewing dispute (internal)
        DISPUTE_RESOLVED_RELEASE,   // Dispute resolved - release (internal)
        DISPUTE_RESOLVED_REFUND,    // Dispute resolved - refund (internal)
        IN_PROGRESS,                // Legacy
        COMPLETED,                  // Legacy
        REJECTED                    // Legacy
    }
    
    public void updateStatus(MilestoneStatus newStatus) {
        this.status = newStatus;
        this.updatedAt = Instant.now();
        // STEP 2: Set completedAt for RELEASED or COMPLETED status
        if (newStatus == MilestoneStatus.COMPLETED || newStatus == MilestoneStatus.RELEASED) {
            this.completedAt = Instant.now();
        }
    }
}
