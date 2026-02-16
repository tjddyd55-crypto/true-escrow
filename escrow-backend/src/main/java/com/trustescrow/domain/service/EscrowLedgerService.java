package com.trustescrow.domain.service;

import com.trustescrow.domain.model.AuditEvent;
import com.trustescrow.domain.model.AuditEventType;
import com.trustescrow.domain.model.EscrowLedgerEntry;
import com.trustescrow.domain.model.LedgerEntryType;
import com.trustescrow.domain.rules.RulesEngine;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Service for managing escrow ledger entries.
 * Ledger is append-only and idempotent.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EscrowLedgerService {
    
    private final EscrowLedgerRepository ledgerRepository;
    private final DealRepository dealRepository;
    private final AuditEventRepository auditEventRepository;
    
    /**
     * Executes an escrow action idempotently.
     * If an entry with the same idempotency key exists, it's a no-op.
     */
    @Transactional
    public EscrowLedgerEntry executeAction(UUID dealId, RulesEngine.EscrowAction action, String actor) {
        // Get currency from deal (SSOT requirement: idempotency key must include currency)
        String currency = dealRepository.findById(dealId)
            .map(deal -> deal.getCurrency())
            .orElseThrow(() -> new IllegalArgumentException("Deal not found: " + dealId));
        
        // Generate idempotency key per SSOT: hash(dealId + referenceId + type + amount + currency)
        String idempotencyKey = generateIdempotencyKey(
            dealId,
            action.getReferenceId(),
            action.getType().name(),
            action.getAmount(),
            currency
        );
        
        // Check if already exists
        if (ledgerRepository.existsByIdempotencyKey(idempotencyKey)) {
            log.info("Ledger action already executed (idempotent): {}", idempotencyKey);
            return ledgerRepository.findByIdempotencyKey(idempotencyKey)
                .orElseThrow(() -> new IllegalStateException("Idempotency key exists but entry not found"));
        }
        
        // Map action type to ledger entry type
        LedgerEntryType entryType = mapActionTypeToEntryType(action.getType());
        
        // Create ledger entry
        EscrowLedgerEntry entry = EscrowLedgerEntry.builder()
            .dealId(dealId)
            .type(entryType)
            .amount(action.getAmount())
            .currency(currency)
            .fromAccount(action.getFromAccount())
            .toAccount(action.getToAccount())
            .referenceId(action.getReferenceId())
            .idempotencyKey(idempotencyKey)
            .createdBy(actor)
            .createdAt(Instant.now())
            .build();
        
        EscrowLedgerEntry saved = ledgerRepository.save(entry);
        log.info("Ledger entry created: {} for deal {}", saved.getId(), dealId);
        
        // Emit audit event per SSOT: all ledger actions must produce audit events
        AuditEvent auditEvent = AuditEvent.builder()
            .dealId(dealId)
            .type(AuditEventType.LEDGER_ACTION_EXECUTED)
            .actor(actor)
            .payload(String.format(
                "{\"ledgerEntryId\":\"%s\",\"type\":\"%s\",\"amount\":\"%s\",\"currency\":\"%s\",\"fromAccount\":\"%s\",\"toAccount\":\"%s\"}",
                saved.getId(), entryType, action.getAmount(), currency, action.getFromAccount(), action.getToAccount()
            ))
            .createdAt(Instant.now())
            .build();
        auditEventRepository.save(auditEvent);
        
        return saved;
    }
    
    /**
     * Generates a deterministic idempotency key per SSOT.
     * Format: hash(dealId + referenceId + type + amount + currency)
     */
    private String generateIdempotencyKey(
        UUID dealId,
        UUID referenceId,
        String type,
        BigDecimal amount,
        String currency
    ) {
        String input = String.format("%s|%s|%s|%s|%s",
            dealId,
            referenceId != null ? referenceId : "",
            type,
            amount.toPlainString(),
            currency
        );
        
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) {
                    hexString.append('0');
                }
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 algorithm not available", e);
        }
    }
    
    private LedgerEntryType mapActionTypeToEntryType(RulesEngine.EscrowActionType actionType) {
        return switch (actionType) {
            case HOLD -> LedgerEntryType.HOLD;
            case RELEASE -> LedgerEntryType.RELEASE;
            case REFUND -> LedgerEntryType.REFUND;
            case OFFSET -> LedgerEntryType.OFFSET;
        };
    }
    
    /**
     * Gets all ledger entries for a deal.
     */
    @Transactional(readOnly = true)
    public List<EscrowLedgerEntry> getLedgerEntries(UUID dealId) {
        return ledgerRepository.findByDealIdOrderByCreatedAtAsc(dealId);
    }
    
    /**
     * Calculates the current balance for a deal.
     * Sum of all HOLD entries minus RELEASE/REFUND/OFFSET entries.
     */
    @Transactional(readOnly = true)
    public BigDecimal calculateBalance(UUID dealId) {
        List<EscrowLedgerEntry> entries = getLedgerEntries(dealId);
        BigDecimal balance = BigDecimal.ZERO;
        
        for (EscrowLedgerEntry entry : entries) {
            switch (entry.getType()) {
                case HOLD -> balance = balance.add(entry.getAmount());
                case RELEASE, REFUND, OFFSET -> balance = balance.subtract(entry.getAmount());
            }
        }
        
        return balance;
    }
    
    /**
     * Checks if holdback is unreleased for a deal.
     */
    @Transactional(readOnly = true)
    public boolean isHoldbackUnreleased(UUID dealId, BigDecimal expectedHoldback) {
        List<EscrowLedgerEntry> entries = getLedgerEntries(dealId);
        
        BigDecimal held = BigDecimal.ZERO;
        BigDecimal released = BigDecimal.ZERO;
        
        for (EscrowLedgerEntry entry : entries) {
            if (entry.getType() == LedgerEntryType.HOLD) {
                held = held.add(entry.getAmount());
            } else if (entry.getType() == LedgerEntryType.RELEASE && 
                       "escrow".equals(entry.getFromAccount())) {
                released = released.add(entry.getAmount());
            }
        }
        
        BigDecimal netHoldback = held.subtract(released);
        return netHoldback.compareTo(expectedHoldback) >= 0;
    }
}
