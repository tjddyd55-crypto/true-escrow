package com.trustescrow.presentation.controller;

import com.trustescrow.application.service.EscrowStateService;
import com.trustescrow.domain.model.Deal;
import com.trustescrow.domain.model.DealMilestone;
import com.trustescrow.domain.model.DealState;
import com.trustescrow.domain.service.DealMilestoneRepository;
import com.trustescrow.domain.service.DealRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * STEP 4: Admin Release API
 * 
 * Allows admin to release funds from escrow for a specific milestone.
 * Only milestones in PAID_HELD status can be released.
 */
@RestController
@RequestMapping("/api/deals")
@RequiredArgsConstructor
@Slf4j
public class MilestoneReleaseController {
    
    private final DealRepository dealRepository;
    private final DealMilestoneRepository milestoneRepository;
    private final EscrowStateService escrowStateService;
    
    /**
     * STEP 4: Release milestone funds from escrow.
     * 
     * POST /api/deals/{dealId}/milestones/{milestoneId}/release
     * 
     * Behavior:
     * - Validate deal & milestone state
     * - Only allow release if status = PAID_HELD
     * - Update milestone → RELEASED
     * - Update deal status accordingly
     * - (Actual payout handled later – for now logical release only)
     */
    @PostMapping("/{dealId}/milestones/{milestoneId}/release")
    @Transactional
    public ResponseEntity<?> releaseMilestone(
            @PathVariable UUID dealId,
            @PathVariable UUID milestoneId,
            @RequestHeader(value = "X-User-Id", required = false) UUID userId) {
        
        log.info("===== STEP 4: MILESTONE RELEASE API START =====");
        log.info("DealId: {}, MilestoneId: {}, Actor: {}", dealId, milestoneId, userId != null ? userId : "system");
        
        try {
            // Validate deal exists
            Optional<Deal> dealOpt = dealRepository.findById(dealId);
            if (dealOpt.isEmpty()) {
                log.warn("Deal {} not found", dealId);
                return ResponseEntity.badRequest()
                    .body(new ErrorResponse("Deal not found: " + dealId));
            }
            
            Deal deal = dealOpt.get();
            log.info("Deal found: state={}", deal.getState());
            
            // Validate milestone exists and belongs to deal
            Optional<DealMilestone> milestoneOpt = milestoneRepository.findByDealIdAndId(dealId, milestoneId);
            if (milestoneOpt.isEmpty()) {
                log.warn("Milestone {} not found for deal {}", milestoneId, dealId);
                return ResponseEntity.badRequest()
                    .body(new ErrorResponse("Milestone not found: " + milestoneId));
            }
            
            DealMilestone milestone = milestoneOpt.get();
            log.info("Milestone found: status={}", milestone.getStatus());
            
            // STEP 4: Validate milestone status = PAID_HELD
            if (milestone.getStatus() != DealMilestone.MilestoneStatus.PAID_HELD) {
                log.warn("Milestone {} is in status {}, cannot release. Only PAID_HELD can be released.", 
                    milestoneId, milestone.getStatus());
                return ResponseEntity.badRequest()
                    .body(new ErrorResponse(
                        String.format("Milestone must be in PAID_HELD status to release. Current status: %s", 
                            milestone.getStatus())));
            }
            
            // STEP 4: Update milestone → RELEASED
            log.info("Updating milestone {} from PAID_HELD to RELEASED", milestoneId);
            milestone.updateStatus(DealMilestone.MilestoneStatus.RELEASED);
            milestoneRepository.save(milestone);
            
            // Update in-memory state
            escrowStateService.setMilestoneReleased(dealId.toString(), milestoneId.toString());
            
            // STEP 4: Update deal status accordingly
            // If all milestones are released, mark deal as COMPLETED
            List<DealMilestone> allMilestones = milestoneRepository.findByDealIdOrderByOrderIndexAsc(dealId);
            boolean allReleased = allMilestones.stream()
                .allMatch(m -> m.getStatus() == DealMilestone.MilestoneStatus.RELEASED);
            
            if (allReleased && deal.getState() != DealState.COMPLETED) {
                log.info("All milestones released, updating deal {} to COMPLETED", dealId);
                deal.transitionTo(DealState.COMPLETED);
                dealRepository.save(deal);
            } else if (deal.getState() == DealState.FUNDS_HELD) {
                // At least one milestone released, move to IN_PROGRESS
                log.info("First milestone released, updating deal {} to IN_PROGRESS", dealId);
                deal.transitionTo(DealState.IN_PROGRESS);
                dealRepository.save(deal);
            }
            
            log.info("===== STEP 4: MILESTONE RELEASE API SUCCESS =====");
            log.info("Milestone {} released successfully", milestoneId);
            
            return ResponseEntity.ok(new ReleaseResponse(
                dealId,
                milestoneId,
                "RELEASED",
                "Milestone funds released from escrow"
            ));
            
        } catch (Exception e) {
            log.error("===== STEP 4: MILESTONE RELEASE API ERROR =====");
            log.error("Error releasing milestone {} for deal {}: {}", milestoneId, dealId, e.getMessage(), e);
            return ResponseEntity.internalServerError()
                .body(new ErrorResponse("Failed to release milestone: " + e.getMessage()));
        }
    }
    
    /**
     * Response DTO for milestone release.
     */
    public record ReleaseResponse(
        UUID dealId,
        UUID milestoneId,
        String status,
        String message
    ) {}
    
    /**
     * Error response DTO.
     */
    public record ErrorResponse(String error) {}
}
