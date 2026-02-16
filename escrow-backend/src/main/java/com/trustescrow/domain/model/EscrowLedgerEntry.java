package com.trustescrow.domain.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "escrow_ledger_entries", 
       indexes = {
           @Index(name = "idx_ledger_deal_created", columnList = "dealId,createdAt"),
           @Index(name = "idx_ledger_idempotency", columnList = "idempotencyKey", unique = true)
       })
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class EscrowLedgerEntry {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(nullable = false)
    private UUID dealId;
    
    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private LedgerEntryType type;
    
    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal amount;
    
    @Column(nullable = false, length = 3)
    private String currency;
    
    @Column(nullable = false)
    private String fromAccount;
    
    @Column(nullable = false)
    private String toAccount;
    
    private UUID referenceId; // ruleEventId or disputeId
    
    @Column(nullable = false, unique = true)
    private String idempotencyKey;
    
    @Column(nullable = false)
    private String createdBy; // system/admin
    
    @Column(nullable = false)
    private Instant createdAt;
    
    // Append-only: no update methods
}
