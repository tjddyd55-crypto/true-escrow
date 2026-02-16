package com.trustescrow.domain.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Lemon Product Mapping entity for Phase 10.
 * Maps Partner Tier to Lemon Squeezy Product ID.
 */
@Entity
@Table(name = "lemon_product_mappings", indexes = {
    @Index(name = "idx_lemon_tier", columnList = "partnerTier", unique = true),
    @Index(name = "idx_lemon_product_id", columnList = "lemonProductId")
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class LemonProductMapping {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(nullable = false, name = "partner_tier")
    @Enumerated(EnumType.STRING)
    private Partner.SubscriptionTier partnerTier;
    
    @Column(nullable = false, name = "lemon_product_id")
    private String lemonProductId; // Lemon Squeezy product ID
    
    @Column(name = "lemon_variant_id")
    private String lemonVariantId; // Lemon Squeezy variant ID (optional)
    
    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal monthlyPrice; // Monthly subscription price
    
    @Column(nullable = false, length = 3)
    private String currency; // Currency code (KRW, USD, etc.)
    
    @Column(nullable = false)
    private Instant createdAt;
    
    @Column(nullable = false)
    private Instant updatedAt;
}
