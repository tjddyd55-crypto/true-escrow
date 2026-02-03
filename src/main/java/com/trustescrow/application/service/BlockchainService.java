package com.trustescrow.application.service;

import com.trustescrow.domain.model.DealMilestone;
import com.trustescrow.domain.model.OnChainRecord;
import com.trustescrow.domain.service.DealMilestoneRepository;
import com.trustescrow.domain.service.OnChainRecordRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

/**
 * STEP 7: Blockchain service for recording escrow state changes.
 * 
 * This service handles:
 * - Creating on-chain records for milestone state changes
 * - Triggering blockchain transactions (delegated to blockchain adapter)
 * - Confirming blockchain transactions
 * 
 * Note: Actual blockchain interaction is delegated to a blockchain adapter
 * (e.g., Web3j, ethers.js integration). This service provides the business logic.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class BlockchainService {
    
    private final OnChainRecordRepository onChainRecordRepository;
    private final DealMilestoneRepository milestoneRepository;
    
    /**
     * STEP 7-2: Record milestone state change on blockchain.
     * 
     * Triggers:
     * - Payment completed → FUNDS_HELD
     * - Admin approval → RELEASED
     * - Refund decision → REFUNDED
     * - Dispute resolved → DISPUTE_RESOLVED_*
     * 
     * @param dealId deal ID
     * @param milestoneId milestone ID
     * @param status milestone status to record
     * @param decidedBy who made the decision ("ADMIN", "SYSTEM", etc.)
     */
    @Transactional
    public void recordMilestoneStatus(UUID dealId, UUID milestoneId, 
                                     OnChainRecord.RecordStatus status, 
                                     String decidedBy) {
        log.info("[BLOCKCHAIN] Recording milestone status: dealId={}, milestoneId={}, status={}, decidedBy={}", 
            dealId, milestoneId, status, decidedBy);
        
        try {
            // Find milestone to get amount/currency
            Optional<DealMilestone> milestoneOpt = milestoneRepository.findById(milestoneId);
            if (milestoneOpt.isEmpty()) {
                log.warn("[BLOCKCHAIN] Milestone not found: {}", milestoneId);
                return;
            }
            
            DealMilestone milestone = milestoneOpt.get();
            
            // Create on-chain record
            OnChainRecord record = OnChainRecord.builder()
                .dealId(dealId)
                .milestoneId(milestoneId)
                .amount(milestone.getAmount())
                .currency("USD") // TODO: Get from deal
                .status(status)
                .decidedBy(decidedBy)
                .timestamp(Instant.now())
                .createdAt(Instant.now())
                .build();
            
            onChainRecordRepository.save(record);
            
            // TODO: Trigger actual blockchain transaction via adapter
            // For now, just log the intent
            log.info("[BLOCKCHAIN] On-chain record created: recordId={}, status={}", 
                record.getId(), status);
            log.info("[BLOCKCHAIN] TODO: Trigger blockchain transaction via adapter");
            
            // In production, this would:
            // 1. Call blockchain adapter to create transaction
            // 2. Get transaction hash
            // 3. Update record with transaction hash
            // 4. Poll for confirmation
            // 5. Mark record as confirmed
            
        } catch (Exception e) {
            log.error("[BLOCKCHAIN] Error recording milestone status: dealId={}, milestoneId={}, error={}", 
                dealId, milestoneId, e.getMessage(), e);
            // Don't throw - blockchain recording failure shouldn't block business logic
        }
    }
    
    /**
     * Confirm blockchain transaction.
     * Called when blockchain transaction is confirmed.
     */
    @Transactional
    public void confirmTransaction(UUID recordId, String txHash, Long blockNumber, String network) {
        log.info("[BLOCKCHAIN] Confirming transaction: recordId={}, txHash={}, blockNumber={}", 
            recordId, txHash, blockNumber);
        
        Optional<OnChainRecord> recordOpt = onChainRecordRepository.findById(recordId);
        if (recordOpt.isPresent()) {
            OnChainRecord record = recordOpt.get();
            record.markConfirmed(txHash, blockNumber, network);
            onChainRecordRepository.save(record);
            log.info("[BLOCKCHAIN] Transaction confirmed: recordId={}, txHash={}", recordId, txHash);
        }
    }
}
