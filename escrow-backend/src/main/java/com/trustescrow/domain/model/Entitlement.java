package com.trustescrow.domain.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

/**
 * Entitlement entity for Phase 10.
 * Represents partner access rights based on payment/subscription.
 * 
 * CRITICAL: Entitlement is granted only after payment is confirmed.
 */
@Entity
@Table(name = "entitlements", indexes = {
    @Index(name = "idx_entitlements_partner", columnList = "partnerId"),
    @Index(name = "idx_entitlements_status", columnList = "status"),
    @Index(name = "idx_entitlements_end_date", columnList = "endDate")
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class Entitlement {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(nullable = false)
    private UUID partnerId;
    
    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private EntitlementType type;
    
    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private EntitlementStatus status;
    
    @Column(nullable = false)
    private Instant startDate;
    
    @Column(nullable = false)
    private Instant endDate;
    
    @Column
    private UUID invoiceId; // For invoice-based entitlement (nullable)
    
    @Column
    private String lemonSubscriptionId; // For subscription-based entitlement (nullable)
    
    @Column(nullable = false)
    private Instant createdAt;
    
    @Column(nullable = false)
    private Instant updatedAt;
    
    public enum EntitlementType {
        SUBSCRIPTION,    // Based on active subscription
        INVOICE_BASED    // Based on paid invoice (one-time or monthly)
    }
    
    public enum EntitlementStatus {
        ACTIVE,      // Partner has active access
        EXPIRED,     // Entitlement period ended, no renewal
        SUSPENDED,   // Manually suspended (admin action)
        CANCELLED    // Subscription cancelled, expires at end of period
    }
    
    public void activate() {
        this.status = EntitlementStatus.ACTIVE;
        this.updatedAt = Instant.now();
    }
    
    public void expire() {
        this.status = EntitlementStatus.EXPIRED;
        this.updatedAt = Instant.now();
    }
    
    public void suspend() {
        this.status = EntitlementStatus.SUSPENDED;
        this.updatedAt = Instant.now();
    }
    
    public void cancel() {
        this.status = EntitlementStatus.CANCELLED;
        this.updatedAt = Instant.now();
    }
    
    public void extend(Instant newEndDate) {
        this.endDate = newEndDate;
        this.updatedAt = Instant.now();
    }
    
    public boolean isActive() {
        return status == EntitlementStatus.ACTIVE && 
               Instant.now().isBefore(endDate);
    }
}
