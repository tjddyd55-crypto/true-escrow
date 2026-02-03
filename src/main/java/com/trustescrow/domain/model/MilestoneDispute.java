package com.trustescrow.domain.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * STEP 6: Milestone-level dispute tracking.
 * 
 * Each dispute is associated with a specific milestone.
 * Disputes can be raised by BUYER or SELLER.
 * Only ADMIN can resolve disputes.
 */
@Entity
@Table(name = "milestone_disputes", indexes = {
    @Index(name = "idx_milestone_disputes_deal_milestone", columnList = "dealId,milestoneId"),
    @Index(name = "idx_milestone_disputes_status", columnList = "status,createdAt")
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class MilestoneDispute {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(nullable = false)
    private UUID dealId;
    
    @Column(nullable = false)
    private UUID milestoneId;
    
    @Column(nullable = false)
    private UUID raisedBy; // BUYER or SELLER user ID
    
    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private DisputeStatus status;
    
    @Column(nullable = false, columnDefinition = "TEXT")
    private String reason;
    
    @Column(columnDefinition = "TEXT[]")
    private List<String> evidenceUrls; // Evidence/document URLs
    
    @Column(nullable = false)
    private Instant createdAt;
    
    @Column(nullable = false)
    private Instant updatedAt;
    
    private Instant reviewedAt;
    private UUID reviewedBy; // ADMIN user ID
    
    private Instant resolvedAt;
    private UUID resolvedBy; // ADMIN user ID
    
    @Enumerated(EnumType.STRING)
    private DisputeResolution resolution; // RELEASE or REFUND
    
    @Column(columnDefinition = "TEXT")
    private String resolutionNote; // Admin's resolution note
    
    /**
     * STEP 6: Dispute status.
     */
    public enum DisputeStatus {
        OPEN,              // Dispute raised, awaiting admin review
        REVIEWING,         // Admin is reviewing
        RESOLVED           // Dispute resolved
    }
    
    /**
     * STEP 6: Dispute resolution decision.
     */
    public enum DisputeResolution {
        RELEASE,  // Release funds to seller
        REFUND    // Refund funds to buyer
    }
    
    /**
     * Mark dispute as under review by admin.
     */
    public void markReviewing(UUID adminId) {
        this.status = DisputeStatus.REVIEWING;
        this.reviewedBy = adminId;
        this.reviewedAt = Instant.now();
        this.updatedAt = Instant.now();
    }
    
    /**
     * Resolve dispute with admin decision.
     */
    public void resolve(DisputeResolution resolution, String note, UUID adminId) {
        this.status = DisputeStatus.RESOLVED;
        this.resolution = resolution;
        this.resolutionNote = note;
        this.resolvedBy = adminId;
        this.resolvedAt = Instant.now();
        this.updatedAt = Instant.now();
    }
}
