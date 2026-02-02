package com.trustescrow.application.job;

import com.trustescrow.domain.model.Deal;
import com.trustescrow.domain.model.DealState;
import com.trustescrow.domain.model.DisputeCase;
import com.trustescrow.domain.model.Timer;
import com.trustescrow.domain.service.DealRepository;
import com.trustescrow.domain.service.DisputeCaseRepository;
import com.trustescrow.domain.service.RulesEngineService;
import com.trustescrow.domain.service.TimerService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Background job for resolving disputes when TTL expires.
 * Runs periodically and processes expired disputes.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DisputeTTLJob {
    
    private final TimerService timerService;
    private final DealRepository dealRepository;
    private final DisputeCaseRepository disputeRepository;
    private final RulesEngineService rulesEngineService;
    
    /**
     * Runs every 10 minutes to check for expired dispute TTLs.
     */
    @Scheduled(fixedRate = 600000) // 10 minutes
    @Transactional
    public void processDisputeTTL() {
        log.info("Running dispute TTL job");
        
        // Find all elapsed DISPUTE_TTL timers
        List<Timer> elapsedTimers = timerService.findElapsedTimers("DISPUTE_TTL");
        
        for (Timer timer : elapsedTimers) {
            try {
                // Acquire lock on deal
                Deal deal = dealRepository.findByIdWithLock(timer.getDealId())
                    .orElse(null);
                
                if (deal == null) {
                    log.warn("Deal not found for timer: {}", timer.getId());
                    continue;
                }
                
                // Only process if still in ISSUE state
                if (deal.getState() != DealState.ISSUE) {
                    log.info("Deal {} is no longer in ISSUE state, skipping", deal.getId());
                    timerService.markTimerFired(timer.getId());
                    continue;
                }
                
                // Get dispute
                DisputeCase dispute = disputeRepository.findByDealId(deal.getId())
                    .orElse(null);
                
                if (dispute == null || dispute.getStatus() != DisputeCase.DisputeStatus.OPEN) {
                    log.info("No open dispute found for deal {}, skipping", deal.getId());
                    timerService.markTimerFired(timer.getId());
                    continue;
                }
                
                // Evaluate rules (will apply default resolution and settle)
                rulesEngineService.evaluateAndExecute(deal.getId(), "system");
                
                // Mark timer as fired
                timerService.markTimerFired(timer.getId());
                
                log.info("Resolved dispute TTL for deal {}", deal.getId());
            } catch (Exception e) {
                log.error("Error processing dispute TTL for timer {}: {}", timer.getId(), e.getMessage(), e);
            }
        }
    }
}
