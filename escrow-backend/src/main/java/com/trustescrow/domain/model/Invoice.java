package com.trustescrow.domain.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Invoice entity for Phase 10.
 * Represents monthly invoices sent to partners.
 * Supports Lemon Squeezy payment integration.
 */
@Entity
@Table(name = "invoices", indexes = {
    @Index(name = "idx_invoices_partner", columnList = "partnerId"),
    @Index(name = "idx_invoices_status", columnList = "status"),
    @Index(name = "idx_invoices_date", columnList = "invoiceDate"),
    @Index(name = "idx_invoices_number", columnList = "invoiceNumber", unique = true),
    @Index(name = "idx_invoices_lemon_order", columnList = "lemonOrderId")
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class Invoice {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(nullable = false, unique = true)
    private String invoiceNumber; // Format: INV-YYYYMM-{partnerId}-{sequence}
    
    @Column(nullable = false)
    private UUID partnerId;
    
    @Column(nullable = false)
    private LocalDate invoiceDate; // 1st of month
    
    @Column(nullable = false)
    private LocalDate dueDate; // Net-14: 14 days after invoice date
    
    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private InvoiceStatus status;
    
    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal totalAmount;
    
    @Column(nullable = false, length = 3)
    private String currency;
    
    @Column(columnDefinition = "TEXT")
    private String lineItemsJson; // JSON array of line items
    
    @Column
    private Instant paidAt; // Nullable until paid
    
    @Column
    private String lemonOrderId; // Lemon Squeezy order ID (nullable until paid)
    
    @Column
    private String lemonCheckoutUrl; // Lemon checkout link (nullable until generated)
    
    @Column(nullable = false)
    private Instant createdAt;
    
    @Column(nullable = false)
    private Instant updatedAt;
    
    public enum InvoiceStatus {
        PENDING, // Generated but not sent
        SENT,    // Sent to partner
        PAID     // Payment received
    }
    
    public void markAsSent() {
        this.status = InvoiceStatus.SENT;
        this.updatedAt = Instant.now();
    }
    
    public void markAsPaid(Instant paidAt, String lemonOrderId) {
        this.status = InvoiceStatus.PAID;
        this.paidAt = paidAt;
        this.lemonOrderId = lemonOrderId;
        this.updatedAt = Instant.now();
    }
    
    public void setLemonCheckoutUrl(String url) {
        this.lemonCheckoutUrl = url;
        this.updatedAt = Instant.now();
    }
}
