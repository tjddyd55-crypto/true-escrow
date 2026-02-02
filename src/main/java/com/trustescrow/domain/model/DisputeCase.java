package com.trustescrow.domain.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "disputes", indexes = {
    @Index(name = "idx_disputes_status_expires", columnList = "status,expiresAt")
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class DisputeCase {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(nullable = false)
    private UUID dealId;
    
    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private IssueReasonCode reasonCode;
    
    @Column(columnDefinition = "TEXT")
    private String freeText; // required if reasonCode is OTHER
    
    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private DisputeStatus status;
    
    @Column(nullable = false)
    private Instant createdAt;
    
    @Column(nullable = false)
    private Instant expiresAt;
    
    private Instant resolvedAt;
    
    private String resolutionOutcome;
    
    private UUID resolvedBy;
    
    public boolean isExpired() {
        return Instant.now().isAfter(expiresAt);
    }
    
    public void markResolved(String outcome, UUID resolvedBy) {
        this.status = DisputeStatus.RESOLVED;
        this.resolutionOutcome = outcome;
        this.resolvedBy = resolvedBy;
        this.resolvedAt = Instant.now();
    }
    
    public enum DisputeStatus {
        OPEN,
        RESOLVED
    }
}
