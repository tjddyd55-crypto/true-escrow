package com.trustescrow.presentation.controller;

import com.trustescrow.domain.model.AuditEvent;
import com.trustescrow.domain.model.AuditEventType;
import com.trustescrow.domain.model.Deal;
import com.trustescrow.domain.model.DealMilestone;
import com.trustescrow.domain.model.MilestoneDispute;
import com.trustescrow.domain.service.AuditEventRepository;
import com.trustescrow.domain.service.DealMilestoneRepository;
import com.trustescrow.domain.service.DealRepository;
import com.trustescrow.domain.service.MilestoneDisputeRepository;
import com.trustescrow.application.service.EscrowStateService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * STEP 6: Milestone Dispute API
 * 
 * Handles dispute creation and resolution for milestones.
 */
@RestController
@RequestMapping("/api/deals")
@RequiredArgsConstructor
@Slf4j
public class MilestoneDisputeController {
    
    private final DealRepository dealRepository;
    private final DealMilestoneRepository milestoneRepository;
    private final MilestoneDisputeRepository disputeRepository;
    private final AuditEventRepository auditEventRepository;
    private final EscrowStateService escrowStateService;
    
    /**
     * STEP 6-2: Create dispute for a milestone.
     * 
     * POST /api/deals/{dealId}/milestones/{milestoneId}/dispute
     * 
     * Permissions: BUYER / SELLER
     * 
     * Required data:
     * {
     *   "reason": "Milestone not completed",
     *   "evidence": ["url1", "url2"]
     * }
     * 
     * Behavior:
     * - status → DISPUTED
     * - dispute record created
     * - audit log recorded
     */
    @PostMapping("/{dealId}/milestones/{milestoneId}/dispute")
    @Transactional
    public ResponseEntity<?> createDispute(
            @PathVariable UUID dealId,
            @PathVariable UUID milestoneId,
            @RequestHeader(value = "X-User-Id", required = false) UUID userId,
            @RequestBody CreateDisputeRequest request) {
        
        log.info("[DISPUTE] Create dispute: dealId={}, milestoneId={}, raisedBy={}", 
            dealId, milestoneId, userId);
        
        try {
            // Validate deal exists
            Optional<Deal> dealOpt = dealRepository.findById(dealId);
            if (dealOpt.isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(new ErrorResponse("Deal not found: " + dealId));
            }
            
            // Validate milestone exists and belongs to deal
            Optional<DealMilestone> milestoneOpt = milestoneRepository.findByDealIdAndId(dealId, milestoneId);
            if (milestoneOpt.isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(new ErrorResponse("Milestone not found: " + milestoneId));
            }
            
            DealMilestone milestone = milestoneOpt.get();
            
            // STEP 6: Validate milestone status - only FUNDS_HELD or RELEASE_REQUESTED can be disputed
            if (milestone.getStatus() != DealMilestone.MilestoneStatus.PAID_HELD &&
                milestone.getStatus() != DealMilestone.MilestoneStatus.RELEASE_REQUESTED) {
                return ResponseEntity.badRequest()
                    .body(new ErrorResponse(
                        String.format("Milestone must be in PAID_HELD or RELEASE_REQUESTED status to dispute. Current: %s", 
                            milestone.getStatus())));
            }
            
            // Check if dispute already exists
            Optional<MilestoneDispute> existingDispute = disputeRepository.findByDealIdAndMilestoneId(dealId, milestoneId);
            if (existingDispute.isPresent() && 
                existingDispute.get().getStatus() != MilestoneDispute.DisputeStatus.RESOLVED) {
                return ResponseEntity.badRequest()
                    .body(new ErrorResponse("Dispute already exists for this milestone"));
            }
            
            // STEP 6: Create dispute record
            MilestoneDispute dispute = MilestoneDispute.builder()
                .dealId(dealId)
                .milestoneId(milestoneId)
                .raisedBy(userId != null ? userId : UUID.randomUUID()) // TODO: Get from auth
                .status(MilestoneDispute.DisputeStatus.OPEN)
                .reason(request.reason())
                .evidenceUrls(request.evidence())
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();
            
            disputeRepository.save(dispute);
            
            // STEP 6: Update milestone status → DISPUTED
            milestone.updateStatus(DealMilestone.MilestoneStatus.DISPUTED);
            milestoneRepository.save(milestone);
            
            // Update in-memory state
            escrowStateService.setMilestoneDisputed(dealId.toString(), milestoneId.toString());
            
            // STEP 6: Record audit log
            String actor = userId != null ? userId.toString() : "anonymous";
            String payload = String.format(
                "{\"disputeId\":\"%s\",\"milestoneId\":\"%s\",\"reason\":\"%s\",\"evidenceCount\":%d}",
                dispute.getId(), milestoneId, request.reason(), 
                request.evidence() != null ? request.evidence().size() : 0
            );
            
            AuditEvent auditEvent = AuditEvent.builder()
                .dealId(dealId)
                .type(AuditEventType.DISPUTE_OPENED)
                .actor(actor)
                .payload(payload)
                .createdAt(Instant.now())
                .build();
            
            auditEventRepository.save(auditEvent);
            
            log.info("[DISPUTE] Dispute created successfully: disputeId={}, milestoneId={}", 
                dispute.getId(), milestoneId);
            
            return ResponseEntity.ok(new DisputeResponse(
                dispute.getId(),
                dealId,
                milestoneId,
                "DISPUTED",
                "Dispute created successfully"
            ));
            
        } catch (Exception e) {
            log.error("[DISPUTE] Error creating dispute: dealId={}, milestoneId={}, error={}", 
                dealId, milestoneId, e.getMessage(), e);
            return ResponseEntity.internalServerError()
                .body(new ErrorResponse("Failed to create dispute: " + e.getMessage()));
        }
    }
    
    /**
     * Request DTO for creating dispute.
     */
    public record CreateDisputeRequest(
        String reason,
        List<String> evidence
    ) {}
    
    /**
     * Response DTO for dispute.
     */
    public record DisputeResponse(
        UUID disputeId,
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
