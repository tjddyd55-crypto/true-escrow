package com.trustescrow.presentation.controller;

import com.trustescrow.domain.model.Deal;
import com.trustescrow.domain.model.DealMilestone;
import com.trustescrow.domain.model.MilestoneDispute;
import com.trustescrow.domain.service.DealRepository;
import com.trustescrow.domain.service.DealMilestoneRepository;
import com.trustescrow.domain.service.MilestoneDisputeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * STEP 7: Dashboard API for escrow operations.
 * 
 * Provides:
 * - KPI statistics
 * - Deal timeline data
 * - Anomaly detection
 */
@RestController
@RequestMapping("/api/admin/dashboard")
@RequiredArgsConstructor
@Slf4j
public class DashboardController {
    
    private final DealRepository dealRepository;
    private final DealMilestoneRepository milestoneRepository;
    private final MilestoneDisputeRepository disputeRepository;
    
    /**
     * GET /api/admin/dashboard/stats
     * Returns KPI statistics.
     */
    @GetMapping("/stats")
    public ResponseEntity<DashboardStats> getStats() {
        log.info("[DASHBOARD] Fetching statistics");
        
        try {
            List<Deal> allDeals = dealRepository.findAll();
            
            // Count deals by state
            long totalDeals = allDeals.size();
            long fundsHeld = allDeals.stream()
                .filter(d -> d.getState() == com.trustescrow.domain.model.DealState.FUNDS_HELD)
                .count();
            
            // Count milestones by status
            List<DealMilestone> allMilestones = milestoneRepository.findAll();
            long releaseRequested = allMilestones.stream()
                .filter(m -> m.getStatus() == DealMilestone.MilestoneStatus.RELEASE_REQUESTED)
                .count();
            
            long disputed = allMilestones.stream()
                .filter(m -> m.getStatus() == DealMilestone.MilestoneStatus.DISPUTED ||
                           m.getStatus() == DealMilestone.MilestoneStatus.DISPUTE_REVIEWING)
                .count();
            
            // Calculate average holding days
            double avgHoldingDays = calculateAverageHoldingDays(allMilestones);
            
            // Count delayed deals
            long delayedDeals = countDelayedDeals(allMilestones);
            
            DashboardStats stats = new DashboardStats(
                totalDeals,
                (int) fundsHeld,
                (int) releaseRequested,
                (int) disputed,
                avgHoldingDays,
                (int) delayedDeals
            );
            
            return ResponseEntity.ok(stats);
            
        } catch (Exception e) {
            log.error("[DASHBOARD] Error fetching stats: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError()
                .body(new DashboardStats(0, 0, 0, 0, 0.0, 0));
        }
    }
    
    /**
     * GET /api/admin/dashboard/anomalies
     * Returns anomaly detection results.
     */
    @GetMapping("/anomalies")
    public ResponseEntity<List<Anomaly>> getAnomalies() {
        log.info("[DASHBOARD] Fetching anomalies");
        
        try {
            List<Anomaly> anomalies = new ArrayList<>();
            
            // Find FUNDS_HELD over 7 days
            List<DealMilestone> milestones = milestoneRepository.findAll();
            Instant sevenDaysAgo = Instant.now().minus(Duration.ofDays(7));
            
            for (DealMilestone m : milestones) {
                if (m.getStatus() == DealMilestone.MilestoneStatus.PAID_HELD) {
                    if (m.getCreatedAt().isBefore(sevenDaysAgo)) {
                        long days = Duration.between(m.getCreatedAt(), Instant.now()).toDays();
                        anomalies.add(new Anomaly(
                            "FUNDS_HELD_OVER_7_DAYS",
                            m.getDealId().toString(),
                            m.getId().toString(),
                            "Funds held for " + days + " days",
                            days
                        ));
                    }
                }
                
                // Find RELEASE_REQUESTED over 48 hours
                if (m.getStatus() == DealMilestone.MilestoneStatus.RELEASE_REQUESTED) {
                    Instant twoDaysAgo = Instant.now().minus(Duration.ofHours(48));
                    if (m.getUpdatedAt().isBefore(twoDaysAgo)) {
                        long hours = Duration.between(m.getUpdatedAt(), Instant.now()).toHours();
                        anomalies.add(new Anomaly(
                            "RELEASE_REQUESTED_OVER_48H",
                            m.getDealId().toString(),
                            m.getId().toString(),
                            "Release requested " + hours + " hours ago",
                            hours
                        ));
                    }
                }
                
                // Find DISPUTED over 3 days
                if (m.getStatus() == DealMilestone.MilestoneStatus.DISPUTED ||
                    m.getStatus() == DealMilestone.MilestoneStatus.DISPUTE_REVIEWING) {
                    Instant threeDaysAgo = Instant.now().minus(Duration.ofDays(3));
                    if (m.getUpdatedAt().isBefore(threeDaysAgo)) {
                        long days = Duration.between(m.getUpdatedAt(), Instant.now()).toDays();
                        anomalies.add(new Anomaly(
                            "DISPUTED_OVER_3_DAYS",
                            m.getDealId().toString(),
                            m.getId().toString(),
                            "Dispute open for " + days + " days",
                            days
                        ));
                    }
                }
            }
            
            return ResponseEntity.ok(anomalies);
            
        } catch (Exception e) {
            log.error("[DASHBOARD] Error fetching anomalies: {}", e.getMessage(), e);
            return ResponseEntity.ok(new ArrayList<>());
        }
    }
    
    private double calculateAverageHoldingDays(List<DealMilestone> milestones) {
        List<DealMilestone> heldMilestones = milestones.stream()
            .filter(m -> m.getStatus() == DealMilestone.MilestoneStatus.PAID_HELD ||
                       m.getStatus() == DealMilestone.MilestoneStatus.RELEASE_REQUESTED ||
                       m.getStatus() == DealMilestone.MilestoneStatus.DISPUTED)
            .collect(Collectors.toList());
        
        if (heldMilestones.isEmpty()) {
            return 0.0;
        }
        
        double totalDays = heldMilestones.stream()
            .mapToLong(m -> Duration.between(m.getCreatedAt(), Instant.now()).toDays())
            .sum();
        
        return totalDays / heldMilestones.size();
    }
    
    private long countDelayedDeals(List<DealMilestone> milestones) {
        Instant sevenDaysAgo = Instant.now().minus(Duration.ofDays(7));
        
        return milestones.stream()
            .filter(m -> m.getStatus() == DealMilestone.MilestoneStatus.PAID_HELD &&
                       m.getCreatedAt().isBefore(sevenDaysAgo))
            .map(DealMilestone::getDealId)
            .distinct()
            .count();
    }
    
    /**
     * DTO for dashboard statistics.
     */
    public record DashboardStats(
        long totalDeals,
        int fundsHeld,
        int releaseRequested,
        int disputed,
        double avgHoldingDays,
        int delayedDeals
    ) {}
    
    /**
     * DTO for anomaly detection.
     */
    public record Anomaly(
        String type,
        String dealId,
        String milestoneId,
        String message,
        long value  // days or hours
    ) {}
}
