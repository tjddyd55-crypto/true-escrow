package com.trustescrow.application.service;

import com.trustescrow.domain.model.RegistryLog;
import com.trustescrow.domain.service.RegistryLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Blockchain Anchoring Service for Registry Extension.
 * 
 * This service provides an interface for anchoring registry data to blockchain.
 * 
 * CRITICAL: Original data/PII must NEVER be stored on-chain.
 * Only Merkle roots and hashes are anchored.
 * 
 * For Phase 9 MVP, this is a design/interface placeholder.
 * Actual blockchain integration is out of scope.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class BlockchainAnchoringService {
    
    private final RegistryLogRepository registryLogRepository;
    private final HashService hashService;
    
    /**
     * Generate Merkle root from registry log entries in a date range.
     * 
     * For Phase 9 MVP: Simple implementation (concatenate hashes and hash again).
     * In production: Use proper Merkle tree implementation.
     * 
     * @param fromDate Start date
     * @param toDate End date
     * @return Merkle root hash
     */
    public String generateMerkleRoot(Instant fromDate, Instant toDate) {
        log.info("Generating Merkle root for date range: {} to {}", fromDate, toDate);
        
        // Get all registry log entries in date range
        List<RegistryLog> entries = registryLogRepository.findByDateRange(fromDate, toDate);
        
        if (entries.isEmpty()) {
            log.warn("No entries found in date range");
            return null;
        }
        
        // Simple Merkle root: concatenate all event hashes and hash the result
        // In production, use proper Merkle tree
        StringBuilder concatenated = new StringBuilder();
        for (RegistryLog entry : entries) {
            if (entry.getEventHash() != null) {
                concatenated.append(entry.getEventHash());
            }
        }
        
        String merkleRoot = hashService.generateHash(concatenated.toString());
        log.info("Merkle root generated: {} (from {} entries)", merkleRoot, entries.size());
        
        return merkleRoot;
    }
    
    /**
     * Anchor Merkle root to blockchain.
     * 
     * For Phase 9 MVP: This is a placeholder.
     * In production: Integrate with actual blockchain (Ethereum, Bitcoin, etc.).
     * 
     * @param merkleRoot Merkle root hash
     * @param fromDate Start date of anchored period
     * @param toDate End date of anchored period
     * @param entryCount Number of entries anchored
     * @return Transaction hash (if successful)
     */
    public String anchorToBlockchain(String merkleRoot, Instant fromDate, Instant toDate, long entryCount) {
        log.info("Anchoring Merkle root to blockchain: {}", merkleRoot);
        
        // Phase 9 MVP: Placeholder - just log the action
        // In production: 
        // 1. Create transaction with merkle root + metadata (date range, count)
        // 2. Sign and broadcast to blockchain
        // 3. Wait for confirmation
        // 4. Record transaction hash in registry_log as ANCHORED event
        
        log.info("Blockchain anchoring placeholder - would anchor: {}", merkleRoot);
        log.info("Period: {} to {}, Entries: {}", fromDate, toDate, entryCount);
        
        // Return placeholder transaction hash
        String txHash = hashService.generateHash(merkleRoot + fromDate.toString() + toDate.toString());
        
        log.info("Placeholder transaction hash: {}", txHash);
        return txHash;
    }
    
    /**
     * Record anchoring event in registry log.
     * 
     * @param escrowAccountId Account ID (can be system account)
     * @param merkleRoot Merkle root that was anchored
     * @param txHash Transaction hash
     * @param fromDate Start date
     * @param toDate End date
     * @param entryCount Number of entries
     */
    public void recordAnchoringEvent(
            UUID escrowAccountId,
            String merkleRoot,
            String txHash,
            Instant fromDate,
            Instant toDate,
            long entryCount) {
        
        // Create event payload
        String eventPayload = String.format(
            "{\"merkle_root\":\"%s\",\"tx_hash\":\"%s\",\"from_date\":\"%s\",\"to_date\":\"%s\",\"entry_count\":%d}",
            merkleRoot, txHash, fromDate, toDate, entryCount
        );
        
        String eventHash = hashService.generateHash(eventPayload);
        
        RegistryLog logEntry = RegistryLog.builder()
            .escrowAccountId(escrowAccountId)
            .assetId(null) // Anchoring is not asset-specific
            .eventType(RegistryLog.EventType.ANCHORED)
            .eventHash(eventHash)
            .eventPayload(eventPayload)
            .createdAt(Instant.now())
            .build();
        
        registryLogRepository.save(logEntry);
        log.info("Anchoring event recorded: {}", logEntry.getId());
    }
    
    /**
     * Scheduled job to anchor registry data to blockchain.
     * 
     * For Phase 9 MVP: Manual trigger only.
     * In production: Schedule daily or N-entry batches.
     */
    public void performAnchoring(Instant fromDate, Instant toDate, UUID systemAccountId) {
        log.info("Performing blockchain anchoring for period: {} to {}", fromDate, toDate);
        
        // Generate Merkle root
        String merkleRoot = generateMerkleRoot(fromDate, toDate);
        if (merkleRoot == null) {
            log.warn("No Merkle root generated, skipping anchoring");
            return;
        }
        
        // Count entries
        List<RegistryLog> entries = registryLogRepository.findByDateRange(fromDate, toDate);
        long entryCount = entries.size();
        
        // Anchor to blockchain
        String txHash = anchorToBlockchain(merkleRoot, fromDate, toDate, entryCount);
        
        // Record anchoring event
        recordAnchoringEvent(systemAccountId, merkleRoot, txHash, fromDate, toDate, entryCount);
        
        log.info("Blockchain anchoring completed: tx_hash={}", txHash);
    }
}
