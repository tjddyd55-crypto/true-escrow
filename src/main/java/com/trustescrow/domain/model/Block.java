package com.trustescrow.domain.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

/**
 * Block - approval unit within a transaction.
 */
@Entity
@Table(name = "blocks", indexes = {
    @Index(name = "idx_blocks_transaction", columnList = "transactionId,orderIndex")
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class Block {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(nullable = false)
    private UUID transactionId;
    
    @Column(nullable = false)
    private String title;
    
    @Column(nullable = false)
    private Integer startDay;
    
    @Column(nullable = false)
    private Integer endDay;
    
    @Column(nullable = false)
    private Integer orderIndex;
    
    private UUID approvalPolicyId;
    
    @Column(nullable = false)
    private Boolean isActive;
    
    @Column(nullable = false)
    private Instant createdAt;
    
    @Column(nullable = false)
    private Instant updatedAt;
    
    public void activate() {
        this.isActive = true;
        this.updatedAt = Instant.now();
    }
    
    public void deactivate() {
        this.isActive = false;
        this.updatedAt = Instant.now();
    }
}
