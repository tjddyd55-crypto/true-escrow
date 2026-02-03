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
    
    public enum MilestoneStatus {
        PENDING,
        IN_PROGRESS,
        COMPLETED,
        REJECTED
    }
    
    public void updateStatus(MilestoneStatus newStatus) {
        this.status = newStatus;
        this.updatedAt = Instant.now();
        if (newStatus == MilestoneStatus.COMPLETED) {
            this.completedAt = Instant.now();
        }
    }
}
