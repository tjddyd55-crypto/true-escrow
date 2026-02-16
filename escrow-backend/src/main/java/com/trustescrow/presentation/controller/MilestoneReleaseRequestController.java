package com.trustescrow.presentation.controller;

import com.trustescrow.domain.model.AuditEvent;
import com.trustescrow.domain.model.AuditEventType;
import com.trustescrow.domain.model.Deal;
import com.trustescrow.domain.model.DealMilestone;
import com.trustescrow.domain.service.AuditEventRepository;
import com.trustescrow.domain.service.DealMilestoneRepository;
import com.trustescrow.domain.service.DealRepository;
import com.trustescrow.application.service.EscrowStateService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

/**
 * STEP 4: Release Request API
 * 
 * Allows buyer/seller to request release of funds from escrow.
 * Only milestones in FUNDS_HELD status can be requested for release.
 * Request must be approved by admin before funds are actually released.
 */
@RestController
@RequestMapping("/api/deals")
@RequiredArgsConstructor
@Slf4j
public class MilestoneReleaseRequestController {
    
    private final DealRepository dealRepository;
    private final DealMilestoneRepository milestoneRepository;
    private final AuditEventRepository auditEventRepository;
    private final EscrowStateService escrowStateService;
    
    /**
     * STEP 4: Request release of milestone funds from escrow.
     * 
     * POST /api/deals/{dealId}/milestones/{milestoneId}/release-request
     * 
     * Behavior:
     * - Validate deal & milestone state
     * - Only allow request if status = FUNDS_HELD
     * - Update milestone → RELEASE_REQUESTED
     * - Record audit log
     */
    @PostMapping("/{dealId}/milestones/{milestoneId}/release-request")
    @Transactional
    public ResponseEntity<?> requestRelease(
            @PathVariable UUID dealId,
            @PathVariable UUID milestoneId,
            @RequestHeader(value = "X-User-Id", required = false) UUID userId,
            @RequestBody(required = false) ReleaseRequestDto requestDto) {
        
        log.info("[RELEASE_REQUEST] Received release request: dealId={}, milestoneId={}, actor={}", 
            dealId, milestoneId, userId != null ? userId : "anonymous");
        
        try {
            // Validate deal exists
            Optional<Deal> dealOpt = dealRepository.findById(dealId);
            if (dealOpt.isEmpty()) {
                log.warn("[RELEASE_REQUEST] Deal {} not found", dealId);
                return ResponseEntity.badRequest()
                    .body(new ErrorResponse("Deal not found: " + dealId));
            }
            
            Deal deal = dealOpt.get();
            
            // Validate milestone exists and belongs to deal
            Optional<DealMilestone> milestoneOpt = milestoneRepository.findByDealIdAndId(dealId, milestoneId);
            if (milestoneOpt.isEmpty()) {
                log.warn("[RELEASE_REQUEST] Milestone {} not found for deal {}", milestoneId, dealId);
                return ResponseEntity.badRequest()
                    .body(new ErrorResponse("Milestone not found: " + milestoneId));
            }
            
            DealMilestone milestone = milestoneOpt.get();
            
            // MASTER TASK: Validate milestone status = EVIDENCE_SUBMITTED
            if (milestone.getStatus() != DealMilestone.MilestoneStatus.EVIDENCE_SUBMITTED) {
                log.warn("[RELEASE_REQUEST] Milestone {} is in status {}, cannot request release. Only EVIDENCE_SUBMITTED can be requested.", 
                    milestoneId, milestone.getStatus());
                return ResponseEntity.badRequest()
                    .body(new ErrorResponse(
                        String.format("Milestone must be in EVIDENCE_SUBMITTED status to request release. Current status: %s. Please upload evidence first.", 
                            milestone.getStatus())));
            }
            
            // STEP 4: Update milestone → RELEASE_REQUESTED
            log.info("[RELEASE_REQUEST] Updating milestone {} from {} to RELEASE_REQUESTED", 
                milestoneId, milestone.getStatus());
            milestone.updateStatus(DealMilestone.MilestoneStatus.RELEASE_REQUESTED);
            milestoneRepository.save(milestone);
            
            // Update in-memory state
            escrowStateService.setMilestoneReleaseRequested(dealId.toString(), milestoneId.toString());
            
            // MASTER TASK STEP 6: Record audit log with before/after status
            String actor = userId != null ? userId.toString() : "anonymous";
            String reason = requestDto != null && requestDto.reason() != null ? requestDto.reason() : "Release requested";
            String beforeStatus = milestone.getStatus().name();
            String payload = String.format(
                "{\"action\":\"RELEASE_REQUESTED\",\"milestoneId\":\"%s\",\"reason\":\"%s\",\"before\":\"%s\",\"after\":\"RELEASE_REQUESTED\"}",
                milestoneId, reason, beforeStatus
            );
            
            AuditEvent auditEvent = AuditEvent.builder()
                .dealId(dealId)
                .type(AuditEventType.RELEASE_REQUESTED)
                .actor(actor)
                .payload(payload)
                .createdAt(Instant.now())
                .build();
            
            auditEventRepository.save(auditEvent);
            log.info("[AUDIT] Release request logged: dealId={}, milestoneId={}, actor={}, before={}, after=RELEASE_REQUESTED", 
                dealId, milestoneId, actor, beforeStatus);
            
            log.info("[RELEASE_REQUEST] Release request submitted successfully: dealId={}, milestoneId={}, actor={}", 
                dealId, milestoneId, actor);
            
            return ResponseEntity.ok(new ReleaseRequestResponse(
                dealId,
                milestoneId,
                "RELEASE_REQUESTED",
                "Release request submitted. Awaiting admin approval."
            ));
            
        } catch (Exception e) {
            log.error("[RELEASE_REQUEST] Error processing release request: dealId={}, milestoneId={}, error={}", 
                dealId, milestoneId, e.getMessage(), e);
            return ResponseEntity.internalServerError()
                .body(new ErrorResponse("Failed to process release request: " + e.getMessage()));
        }
    }
    
    /**
     * Request DTO for release request.
     */
    public record ReleaseRequestDto(String reason) {}
    
    /**
     * Response DTO for release request.
     */
    public record ReleaseRequestResponse(
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
