package com.trustescrow.domain.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * STEP 7: On-chain record for escrow milestones.
 * 
 * Records milestone status changes on blockchain for immutable proof.
 * 
 * Note: This is NOT for on-chain payment, but for on-chain proof/confirmation.
 * Payment is handled by Lemon Squeezy (off-chain).
 * Blockchain provides immutable record of state changes and decisions.
 */
@Entity
@Table(name = "on_chain_records", indexes = {
    @Index(name = "idx_onchain_deal_milestone", columnList = "dealId,milestoneId"),
    @Index(name = "idx_onchain_tx_hash", columnList = "transactionHash", unique = true)
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class OnChainRecord {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(nullable = false)
    private UUID dealId;
    
    @Column(nullable = false)
    private UUID milestoneId;
    
    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal amount;
    
    @Column(nullable = false, length = 3)
    private String currency;
    
    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private RecordStatus status;
    
    @Column(nullable = false)
    private String decidedBy; // "ADMIN" | "SYSTEM" | "BUYER" | "SELLER"
    
    @Column(nullable = false)
    private Instant timestamp;
    
    @Column(nullable = false)
    private Instant createdAt;
    
    // Blockchain transaction details
    private String transactionHash; // Blockchain transaction hash
    private Long blockNumber;       // Block number
    private String network;         // "ethereum" | "polygon" | "arbitrum" etc.
    private Instant confirmedAt;    // When transaction was confirmed
    
    /**
     * STEP 7: On-chain record status.
     * These correspond to milestone statuses that should be recorded on-chain.
     */
    public enum RecordStatus {
        FUNDS_HELD,              // Payment completed, funds held
        RELEASED,                 // Funds released to seller
        REFUNDED,                 // Funds refunded to buyer
        DISPUTE_RESOLVED_RELEASE, // Dispute resolved - release
        DISPUTE_RESOLVED_REFUND   // Dispute resolved - refund
    }
    
    /**
     * Set transaction hash (before confirmation).
     */
    public void setTransactionHash(String txHash) {
        this.transactionHash = txHash;
    }
    
    /**
     * Set network.
     */
    public void setNetwork(String network) {
        this.network = network;
    }
    
    /**
     * Mark record as confirmed on blockchain.
     */
    public void markConfirmed(String txHash, Long blockNumber, String network) {
        this.transactionHash = txHash;
        this.blockNumber = blockNumber;
        this.network = network;
        this.confirmedAt = Instant.now();
    }
}
