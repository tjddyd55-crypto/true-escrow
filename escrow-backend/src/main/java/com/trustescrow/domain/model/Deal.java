package com.trustescrow.domain.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "deals", indexes = {
    @Index(name = "idx_deals_state_updated", columnList = "state,updatedAt")
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class Deal {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(nullable = false)
    private UUID buyerId;
    
    @Column(nullable = false)
    private UUID sellerId;
    
    @Column(nullable = false)
    private String itemRef;
    
    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private DealCategory category;
    
    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal totalAmount;
    
    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal immediateAmount;
    
    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal holdbackAmount;
    
    @Column(nullable = false, length = 3)
    private String currency;
    
    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private DealState state;
    
    @Column(nullable = false)
    private UUID contractInstanceId;
    
    @Column(nullable = false)
    private Instant createdAt;
    
    @Column(nullable = false)
    private Instant updatedAt;
    
    private Instant inspectionStartedAt;
    
    private Instant issueRaisedAt;
    
    private Boolean disputeOpen;
    
    public void transitionTo(DealState newState) {
        this.state = newState;
        this.updatedAt = Instant.now();
    }
    
    public void markInspectionStarted() {
        this.inspectionStartedAt = Instant.now();
    }
    
    public void markIssueRaised() {
        this.issueRaisedAt = Instant.now();
    }
    
    public void setDisputeOpen(boolean open) {
        this.disputeOpen = open;
    }
}
