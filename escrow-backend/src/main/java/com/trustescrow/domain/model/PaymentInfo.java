package com.trustescrow.domain.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Payment information for escrow deals.
 * Dedicated payment setup page.
 */
@Entity
@Table(name = "payment_infos", indexes = {
    @Index(name = "idx_payment_infos_deal", columnList = "dealId", unique = true),
    @Index(name = "idx_payment_infos_buyer", columnList = "buyerId")
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class PaymentInfo {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(nullable = false, unique = true)
    private UUID dealId;
    
    @Column(nullable = false)
    private UUID buyerId;
    
    @Column(nullable = false)
    private UUID sellerId;
    
    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal totalAmount;
    
    @Column(nullable = false, length = 3)
    private String currency;
    
    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private PaymentStatus status;
    
    @Column(nullable = false)
    private Instant createdAt;
    
    @Column(nullable = false)
    private Instant updatedAt;
    
    private String paymentMethod; // e.g., "CARD", "BANK_TRANSFER"
    private String paymentProvider; // e.g., "LEMON_SQUEEZY", "STRIPE"
    private String externalPaymentId; // External payment system ID
    
    private Instant paidAt;
    private String failureReason;
    
    public enum PaymentStatus {
        PENDING,
        PROCESSING,
        PAID,
        FAILED,
        REFUNDED
    }
    
    public void updateStatus(PaymentStatus newStatus) {
        this.status = newStatus;
        this.updatedAt = Instant.now();
        if (newStatus == PaymentStatus.PAID) {
            this.paidAt = Instant.now();
        }
    }
    
    public void markAsFailed(String reason) {
        this.status = PaymentStatus.FAILED;
        this.failureReason = reason;
        this.updatedAt = Instant.now();
    }
}
