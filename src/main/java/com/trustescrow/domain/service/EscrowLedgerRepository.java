package com.trustescrow.domain.service;

import com.trustescrow.domain.model.EscrowLedgerEntry;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface EscrowLedgerRepository extends JpaRepository<EscrowLedgerEntry, UUID> {
    
    List<EscrowLedgerEntry> findByDealIdOrderByCreatedAtAsc(UUID dealId);
    
    boolean existsByIdempotencyKey(String idempotencyKey);
    
    Optional<EscrowLedgerEntry> findByIdempotencyKey(String idempotencyKey);
}
