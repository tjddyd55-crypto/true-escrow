package com.trustescrow.domain.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

/**
 * Partner entity for Phase 10.
 * Represents a business partner (marketplace, dealer, agency) using the platform.
 * Supports Lemon Squeezy subscription integration.
 */
@Entity
@Table(name = "partners", indexes = {
    @Index(name = "idx_partners_created", columnList = "createdAt"),
    @Index(name = "idx_partners_lemon_customer", columnList = "lemonCustomerId")
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class Partner {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(nullable = false)
    private String name;
    
    @Column(nullable = false)
    private String contactEmail;
    
    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private PricingModel pricingModel;
    
    @Column
    @Enumerated(EnumType.STRING)
    private SubscriptionTier tier; // Nullable for PER_DEAL model
    
    @Column
    private Instant contractAgreedAt; // Nullable until contract agreed
    
    @Column(nullable = false)
    private Instant createdAt;
    
    @Column(nullable = false)
    private Instant updatedAt;
    
    @Column
    private String dashboardToken; // Simple token for Phase 9 authentication
    
    @Column
    private String lemonCustomerId; // Lemon Squeezy customer ID (nullable)
    
    @Column
    private String lemonSubscriptionId; // Lemon Squeezy subscription ID (nullable)
    
    public enum PricingModel {
        PER_DEAL,      // Per-deal fee only
        SUBSCRIPTION,  // Monthly subscription only
        HYBRID         // Subscription + per-deal fee
    }
    
    public enum SubscriptionTier {
        STARTER,       // ₩500,000/month, 10 deals, 1.5% per deal
        PROFESSIONAL,  // ₩2,000,000/month, 50 deals, 1.2% per deal
        ENTERPRISE     // ₩5,000,000/month, unlimited, 1.0% per deal
    }
    
    public void updatePricingModel(PricingModel model, SubscriptionTier tier) {
        this.pricingModel = model;
        this.tier = tier;
        this.updatedAt = Instant.now();
    }
    
    public void recordContractAgreement() {
        this.contractAgreedAt = Instant.now();
        this.updatedAt = Instant.now();
    }
    
    public void setDashboardToken(String token) {
        this.dashboardToken = token;
        this.updatedAt = Instant.now();
    }
    
    public void setLemonCustomerId(String customerId) {
        this.lemonCustomerId = customerId;
        this.updatedAt = Instant.now();
    }
    
    public void setLemonSubscriptionId(String subscriptionId) {
        this.lemonSubscriptionId = subscriptionId;
        this.updatedAt = Instant.now();
    }
}
