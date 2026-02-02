package com.trustescrow.application.job;

import com.trustescrow.domain.model.Deal;
import com.trustescrow.domain.model.DealState;
import com.trustescrow.domain.service.DealRepository;
import com.trustescrow.domain.service.EscrowLedgerService;
import com.trustescrow.domain.service.RulesEngineService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Background job for releasing holdback on APPROVED deals.
 * Runs periodically and processes deals in APPROVED state with unreleased holdback.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class HoldbackReleaseJob {
    
    private final DealRepository dealRepository;
    private final EscrowLedgerService ledgerService;
    private final RulesEngineService rulesEngineService;
    
    /**
     * Runs every 5 minutes to check for APPROVED deals with unreleased holdback.
     */
    @Scheduled(fixedRate = 300000) // 5 minutes
    @Transactional
    public void processHoldbackRelease() {
        log.info("Running holdback release job");
        
        // Find all deals in APPROVED state
        List<Deal> approvedDeals = dealRepository.findByState(DealState.APPROVED);
        
        for (Deal deal : approvedDeals) {
            try {
                // Acquire lock on deal
                Deal lockedDeal = dealRepository.findByIdWithLock(deal.getId())
                    .orElse(null);
                
                if (lockedDeal == null) {
                    continue;
                }
                
                // Double-check state (might have changed)
                if (lockedDeal.getState() != DealState.APPROVED) {
                    continue;
                }
                
                // Check if holdback is unreleased
                boolean holdbackUnreleased = ledgerService.isHoldbackUnreleased(
                    lockedDeal.getId(),
                    lockedDeal.getHoldbackAmount()
                );
                
                if (holdbackUnreleased) {
                    // Evaluate rules (will release holdback and move to SETTLED)
                    rulesEngineService.evaluateAndExecute(lockedDeal.getId(), "system");
                    
                    log.info("Released holdback for deal {}", lockedDeal.getId());
                }
            } catch (Exception e) {
                log.error("Error processing holdback release for deal {}: {}", deal.getId(), e.getMessage(), e);
            }
        }
    }
}
