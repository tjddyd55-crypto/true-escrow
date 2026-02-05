package com.trustescrow.domain.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

/**
 * Approver for a block.
 */
@Entity
@Table(name = "block_approvers", indexes = {
    @Index(name = "idx_block_approvers_block", columnList = "blockId")
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class BlockApprover {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(nullable = false)
    private UUID blockId;
    
    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private ApproverRole role;
    
    private UUID userId; // Optional, can be null for role-based
    
    @Column(nullable = false)
    private Boolean required;
    
    @Column(nullable = false)
    private Instant createdAt;
    
    public enum ApproverRole {
        BUYER,
        SELLER,
        VERIFIER
    }
}
