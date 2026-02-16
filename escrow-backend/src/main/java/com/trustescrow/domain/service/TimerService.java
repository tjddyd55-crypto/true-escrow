package com.trustescrow.domain.service;

import com.trustescrow.domain.model.Timer;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Service for managing timers.
 * Timers are used for auto-approve, dispute TTL, and holdback release.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class TimerService {
    
    private final TimerRepository timerRepository;
    
    /**
     * Creates a timer for a deal.
     */
    @Transactional
    public Timer createTimer(UUID dealId, String timerType, Duration duration) {
        Timer timer = Timer.builder()
            .dealId(dealId)
            .timerType(timerType)
            .startedAt(Instant.now())
            .duration(duration)
            .active(true)
            .build();
        
        return timerRepository.save(timer);
    }
    
    /**
     * Finds all active timers that have elapsed.
     */
    @Transactional(readOnly = true)
    public List<Timer> findElapsedTimers(String timerType) {
        return timerRepository.findActiveByType(timerType).stream()
            .filter(Timer::isElapsed)
            .toList();
    }
    
    /**
     * Marks a timer as fired (no longer active).
     */
    @Transactional
    public void markTimerFired(UUID timerId) {
        Timer timer = timerRepository.findById(timerId)
            .orElseThrow(() -> new IllegalArgumentException("Timer not found: " + timerId));
        
        timer.markFired();
        timerRepository.save(timer);
    }
    
    /**
     * Finds active timer for a deal by type.
     */
    @Transactional(readOnly = true)
    public Timer findActiveTimer(UUID dealId, String timerType) {
        return timerRepository.findByDealIdAndTimerTypeAndActive(dealId, timerType, true)
            .orElse(null);
    }
}
