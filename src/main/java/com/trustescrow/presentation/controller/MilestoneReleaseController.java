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
 * STEP 4: Admin Release Approval API
 * 
 * Allows admin to approve release of funds from escrow for a specific milestone.
 * Only milestones in RELEASE_REQUESTED status can be approved for release.
 * 
 * ⚠️ ADMIN ONLY - This endpoint requires admin privileges.
 */
@RestController
@RequestMapping("/api/admin/deals")
@RequiredArgsConstructor
@Slf4j
public class MilestoneReleaseController {
    
    private final DealRepository dealRepository;
    private final DealMilestoneRepository milestoneRepository;
    private final EscrowStateService escrowStateService;
    private final com.trustescrow.domain.service.AuditEventRepository auditEventRepository;
    
    /**
     * STEP 4: Approve release of milestone funds from escrow (ADMIN ONLY).
     * 
     * POST /api/admin/deals/{dealId}/milestones/{milestoneId}/release
     * 
     * Behavior:
     * - Validate deal & milestone state
     * - Only allow approval if status = RELEASE_REQUESTED
     * - Update milestone → RELEASED
     * - Record audit log
     * - Update deal status accordingly
     * - (Actual payout handled later – for now logical release only)
     * 
     * ⚠️ TODO: Add admin authorization check (e.g., @PreAuthorize("hasRole('ADMIN')"))
     */
    @PostMapping("/{dealId}/milestones/{milestoneId}/release")
    @Transactional
    public ResponseEntity<?> approveRelease(
            @PathVariable UUID dealId,
            @PathVariable UUID milestoneId,
            @RequestHeader(value = "X-User-Id", required = false) UUID userId,
            @RequestHeader(value = "X-User-Role", required = false) String userRole) {
        
        log.info("[RELEASE_APPROVAL] Admin release approval: dealId={}, milestoneId={}, actor={}, role={}", 
            dealId, milestoneId, userId != null ? userId : "system", userRole != null ? userRole : "unknown");
        
        // STEP 4: Basic admin check (TODO: Replace with proper Spring Security)
        if (userRole == null || !"ADMIN".equalsIgnoreCase(userRole)) {
            log.warn("[RELEASE_APPROVAL] Unauthorized: user role is not ADMIN (role={})", userRole);
            return ResponseEntity.status(403)
                .body(new ErrorResponse("Only ADMIN users can approve release requests"));
        }
        
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
            
            // STEP 4: Validate milestone status = RELEASE_REQUESTED
            if (milestone.getStatus() != DealMilestone.MilestoneStatus.RELEASE_REQUESTED) {
                log.warn("[RELEASE_APPROVAL] Milestone {} is in status {}, cannot approve. Only RELEASE_REQUESTED can be approved.", 
                    milestoneId, milestone.getStatus());
                return ResponseEntity.badRequest()
                    .body(new ErrorResponse(
                        String.format("Milestone must be in RELEASE_REQUESTED status to approve. Current status: %s", 
                            milestone.getStatus())));
            }
            
            // STEP 4: Update milestone → RELEASED
            log.info("[RELEASE_APPROVAL] Approving release: milestone {} from RELEASE_REQUESTED to RELEASED", milestoneId);
            milestone.updateStatus(DealMilestone.MilestoneStatus.RELEASED);
            milestoneRepository.save(milestone);
            
            // Update in-memory state
            escrowStateService.setMilestoneReleased(dealId.toString(), milestoneId.toString());
            
            // STEP 4: Record audit log
            String actor = userId != null ? userId.toString() : "admin";
            String payload = String.format(
                "{\"milestoneId\":\"%s\",\"action\":\"RELEASE_APPROVED\",\"fromStatus\":\"RELEASE_REQUESTED\",\"toStatus\":\"RELEASED\"}",
                milestoneId
            );
            
            com.trustescrow.domain.model.AuditEvent auditEvent = com.trustescrow.domain.model.AuditEvent.builder()
                .dealId(dealId)
                .type(com.trustescrow.domain.model.AuditEventType.RELEASE_APPROVED)
                .actor(actor)
                .payload(payload)
                .createdAt(java.time.Instant.now())
                .build();
            
            auditEventRepository.save(auditEvent);
            log.info("[RELEASE_APPROVAL] Audit log recorded: dealId={}, milestoneId={}, actor={}", 
                dealId, milestoneId, actor);
            
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
