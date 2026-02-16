package com.trustescrow.domain.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Revenue Ledger Entry (Phase 8+).
 *
 * CRITICAL: This ledger is append-only and separate from Escrow Ledger.
 * It references deals for reporting only and never touches escrow accounts.
 */
@Entity
@Table(name = "revenue_ledger_entries", indexes = {
    @Index(name = "idx_revenue_partner_created", columnList = "partnerId,createdAt"),
    @Index(name = "idx_revenue_deal", columnList = "dealId"),
    @Index(name = "idx_revenue_invoice", columnList = "invoiceId")
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class RevenueLedgerEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private UUID dealId;

    @Column(nullable = false)
    private UUID partnerId;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal amount;

    @Column(nullable = false, length = 3)
    private String currency;

    @Column(nullable = false)
    private Instant settledAt;

    @Column
    private UUID invoiceId;

    @Column(nullable = false)
    private Instant createdAt;

    public void assignToInvoice(UUID invoiceId) {
        this.invoiceId = invoiceId;
    }
}
