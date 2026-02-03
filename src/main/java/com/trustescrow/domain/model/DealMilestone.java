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
     * STEP 2: Milestone status for escrow flow.
     * - PENDING: Initial state, payment not yet made
     * - PAID_HELD: Payment received, funds held in escrow
     * - RELEASED: Funds released to seller (admin action)
     * - REFUNDED: Payment refunded to buyer
     * 
     * Legacy statuses (for backward compatibility):
     * - IN_PROGRESS: Work in progress
     * - COMPLETED: Work completed (legacy)
     * - REJECTED: Work rejected (legacy)
     */
    public enum MilestoneStatus {
        PENDING,
        PAID_HELD,      // STEP 2: Payment received, funds held
        RELEASED,       // STEP 2: Funds released
        REFUNDED,       // STEP 2: Payment refunded
        IN_PROGRESS,    // Legacy
        COMPLETED,      // Legacy
        REJECTED        // Legacy
    }
    
    public void updateStatus(MilestoneStatus newStatus) {
        this.status = newStatus;
        this.updatedAt = Instant.now();
        if (newStatus == MilestoneStatus.COMPLETED) {
            this.completedAt = Instant.now();
        }
    }
}
