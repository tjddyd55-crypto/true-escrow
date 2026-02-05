package com.trustescrow.domain.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

/**
 * Approval policy for blocks.
 */
@Entity
@Table(name = "approval_policies")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class ApprovalPolicy {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private ApprovalType type;
    
    private Integer threshold; // For THRESHOLD type
    
    @Column(nullable = false)
    private Instant createdAt;
    
    public enum ApprovalType {
        SINGLE,
        ALL,
        ANY,
        THRESHOLD
    }
}
