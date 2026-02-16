package com.trustescrow.domain.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Milestone for Transaction-based escrow UX.
 */
@Entity
@Table(name = "transaction_milestones", indexes = {
    @Index(name = "idx_transaction_milestones_transaction", columnList = "transactionId,orderIndex")
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class TransactionMilestone {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(nullable = false)
    private UUID transactionId;
    
    @Column(nullable = false)
    private String title;
    
    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal amount; // Simulated amount
    
    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private MilestoneStatus status;
    
    @Column(nullable = false)
    private Integer orderIndex;
    
    @Column(nullable = false)
    private Instant createdAt;
    
    @Column(nullable = false)
    private Instant updatedAt;
    
    public enum MilestoneStatus {
        PENDING,
        SUBMITTED,
        APPROVED
    }
    
    public void updateStatus(MilestoneStatus newStatus) {
        this.status = newStatus;
        this.updatedAt = Instant.now();
    }
}
