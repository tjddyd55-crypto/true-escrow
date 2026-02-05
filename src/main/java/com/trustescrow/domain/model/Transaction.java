package com.trustescrow.domain.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

/**
 * Simplified Transaction entity for Escrow UX demo.
 * This is a simulation-focused structure separate from Deal.
 */
@Entity
@Table(name = "transactions", indexes = {
    @Index(name = "idx_transactions_buyer", columnList = "buyerId"),
    @Index(name = "idx_transactions_seller", columnList = "sellerId"),
    @Index(name = "idx_transactions_status", columnList = "status")
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class Transaction {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(nullable = false)
    private String title;
    
    @Column(nullable = false)
    private UUID buyerId;
    
    @Column(nullable = false)
    private UUID sellerId;
    
    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private TransactionStatus status;
    
    @Column(nullable = false)
    private Instant createdAt;
    
    @Column(nullable = false)
    private Instant updatedAt;
    
    public enum TransactionStatus {
        CREATED,
        ESCROW_SIMULATED,
        IN_PROGRESS,
        WAITING_APPROVAL,
        COMPLETED,
        PAUSED
    }
    
    public void updateStatus(TransactionStatus newStatus) {
        this.status = newStatus;
        this.updatedAt = Instant.now();
    }
}
