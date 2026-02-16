package com.trustescrow.application.job;

import com.trustescrow.domain.model.Deal;
import com.trustescrow.domain.model.DealState;
import com.trustescrow.domain.model.Timer;
import com.trustescrow.domain.service.DealRepository;
import com.trustescrow.domain.service.RulesEngineService;
import com.trustescrow.domain.service.TimerService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Background job for auto-approving deals when inspection timer elapses.
 * Runs periodically and processes deals in INSPECTION state with elapsed timers.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class AutoApproveJob {
    
    private final TimerService timerService;
    private final DealRepository dealRepository;
    private final RulesEngineService rulesEngineService;
    
    /**
     * Runs every 5 minutes to check for elapsed auto-approve timers.
     */
    @Scheduled(fixedRate = 300000) // 5 minutes
    @Transactional
    public void processAutoApprove() {
        log.info("Running auto-approve job");
        
        // Find all elapsed AUTO_APPROVE timers
        List<Timer> elapsedTimers = timerService.findElapsedTimers("AUTO_APPROVE");
        
        for (Timer timer : elapsedTimers) {
            try {
                // Acquire lock on deal
                Deal deal = dealRepository.findByIdWithLock(timer.getDealId())
                    .orElse(null);
                
                if (deal == null) {
                    log.warn("Deal not found for timer: {}", timer.getId());
                    continue;
                }
                
                // Only process if still in INSPECTION state
                if (deal.getState() != DealState.INSPECTION) {
                    log.info("Deal {} is no longer in INSPECTION state, skipping", deal.getId());
                    timerService.markTimerFired(timer.getId());
                    continue;
                }
                
                // Evaluate rules (will transition to APPROVED and release holdback)
                rulesEngineService.evaluateAndExecute(deal.getId(), "system");
                
                // Mark timer as fired
                timerService.markTimerFired(timer.getId());
                
                log.info("Auto-approved deal {}", deal.getId());
            } catch (Exception e) {
                log.error("Error processing auto-approve for timer {}: {}", timer.getId(), e.getMessage(), e);
            }
        }
    }
}
