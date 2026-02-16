package com.trustescrow.domain.service;

import com.trustescrow.domain.model.OnChainRecord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * STEP 7: Repository for on-chain records.
 */
public interface OnChainRecordRepository extends JpaRepository<OnChainRecord, UUID> {
    
    /**
     * Find records by deal and milestone.
     */
    List<OnChainRecord> findByDealIdAndMilestoneIdOrderByCreatedAtDesc(UUID dealId, UUID milestoneId);
    
    /**
     * Find records by deal.
     */
    List<OnChainRecord> findByDealIdOrderByCreatedAtDesc(UUID dealId);
    
    /**
     * Find record by transaction hash.
     */
    Optional<OnChainRecord> findByTransactionHash(String transactionHash);
    
    /**
     * Find unconfirmed records (not yet recorded on blockchain).
     */
    List<OnChainRecord> findByTransactionHashIsNullOrderByCreatedAtAsc();
}
