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
    private final BlockchainContractService contractService;
    
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
            
            // STEP 7-B: Trigger actual blockchain transaction
            int contractStatus = mapToContractStatus(status);
            Optional<String> txHashOpt = contractService.recordStatus(
                dealId.toString(),
                milestoneId.toString(),
                contractStatus
            );
            
            if (txHashOpt.isPresent()) {
                String txHash = txHashOpt.get();
                record.setTransactionHash(txHash);
                record.setNetwork("sepolia"); // TODO: Get from config
                onChainRecordRepository.save(record);
                log.info("[BLOCKCHAIN] On-chain transaction sent: recordId={}, txHash={}, status={}", 
                    record.getId(), txHash, status);
                
                // TODO: Poll for confirmation in background
                // For now, transaction is sent but not confirmed
            } else {
                log.warn("[BLOCKCHAIN] Failed to send on-chain transaction: recordId={}, status={}", 
                    record.getId(), status);
            }
            
        } catch (Exception e) {
            log.error("[BLOCKCHAIN] Error recording milestone status: dealId={}, milestoneId={}, error={}", 
                dealId, milestoneId, e.getMessage(), e);
            // Don't throw - blockchain recording failure shouldn't block business logic
        }
    }
    
    /**
     * Map OnChainRecord.RecordStatus to contract status (0, 1, 2).
     */
    private int mapToContractStatus(OnChainRecord.RecordStatus status) {
        return switch (status) {
            case FUNDS_HELD -> 0;
            case RELEASED -> 1;
            case REFUNDED -> 2;
            default -> {
                log.warn("[BLOCKCHAIN] Unknown status: {}, defaulting to FUNDS_HELD", status);
                yield 0;
            }
        };
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
