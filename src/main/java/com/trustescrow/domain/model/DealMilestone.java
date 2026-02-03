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
     * STEP 6: Milestone status for escrow flow with approval and dispute system.
     * - PENDING: Initial state, payment not yet made
     * - PAID_HELD: Payment received, funds held in escrow
     * - RELEASE_REQUESTED: Release request submitted (awaiting admin approval)
     * - RELEASED: Funds released to seller (admin approved)
     * - REFUNDED: Payment refunded to buyer
     * - DISPUTED: Dispute raised (STEP 6)
     * - DISPUTE_REVIEWING: Admin reviewing dispute (STEP 6)
     * - DISPUTE_RESOLVED_RELEASE: Dispute resolved - release funds (STEP 6)
     * - DISPUTE_RESOLVED_REFUND: Dispute resolved - refund funds (STEP 6)
     * 
     * State transitions (strict):
     * - PENDING → PAID_HELD (via webhook)
     * - PAID_HELD → RELEASE_REQUESTED (via release request API)
     * - PAID_HELD → DISPUTED (via dispute API) - STEP 6
     * - RELEASE_REQUESTED → DISPUTED (via dispute API) - STEP 6
     * - RELEASE_REQUESTED → RELEASED (via admin approval API)
     * - DISPUTED → DISPUTE_REVIEWING (automatic when admin starts review)
     * - DISPUTE_REVIEWING → DISPUTE_RESOLVED_RELEASE (via admin resolve API)
     * - DISPUTE_REVIEWING → DISPUTE_RESOLVED_REFUND (via admin resolve API)
     * 
     * Reverse transitions are NOT allowed:
     * - RELEASED → PAID_HELD ❌
     * - REFUNDED → RELEASED ❌
     * - DISPUTE_RESOLVED_* → DISPUTED ❌
     * 
     * Legacy statuses (for backward compatibility):
     * - IN_PROGRESS: Work in progress
     * - COMPLETED: Work completed (legacy)
     * - REJECTED: Work rejected (legacy)
     */
    public enum MilestoneStatus {
        PENDING,
        PAID_HELD,                  // STEP 2: Payment received, funds held
        RELEASE_REQUESTED,          // STEP 4: Release request submitted
        RELEASED,                   // STEP 4: Funds released (admin approved)
        REFUNDED,                   // STEP 2: Payment refunded
        DISPUTED,                   // STEP 6: Dispute raised
        DISPUTE_REVIEWING,          // STEP 6: Admin reviewing dispute
        DISPUTE_RESOLVED_RELEASE,   // STEP 6: Dispute resolved - release
        DISPUTE_RESOLVED_REFUND,    // STEP 6: Dispute resolved - refund
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
