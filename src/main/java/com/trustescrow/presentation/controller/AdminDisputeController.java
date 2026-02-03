package com.trustescrow.presentation.controller;

import com.trustescrow.domain.model.AuditEvent;
import com.trustescrow.domain.model.AuditEventType;
import com.trustescrow.domain.model.DealMilestone;
import com.trustescrow.domain.model.MilestoneDispute;
import com.trustescrow.domain.service.AuditEventRepository;
import com.trustescrow.domain.service.DealMilestoneRepository;
import com.trustescrow.domain.service.MilestoneDisputeRepository;
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
 * STEP 6-3: Admin Dispute Resolution API
 * 
 * Allows admin to resolve disputes.
 * Only ADMIN can resolve disputes.
 */
@RestController
@RequestMapping("/api/admin/disputes")
@RequiredArgsConstructor
@Slf4j
public class AdminDisputeController {
    
    private final MilestoneDisputeRepository disputeRepository;
    private final DealMilestoneRepository milestoneRepository;
    private final AuditEventRepository auditEventRepository;
    private final EscrowStateService escrowStateService;
    private final com.trustescrow.application.service.BlockchainService blockchainService;
    
    /**
     * STEP 6-3: Resolve dispute (ADMIN ONLY).
     * 
     * POST /api/admin/disputes/{disputeId}/resolve
     * 
     * Request body:
     * {
     *   "decision": "RELEASE" | "REFUND",
     *   "note": "관리자 판단 사유"
     * }
     * 
     * Result:
     * - RELEASE → DISPUTE_RESOLVED_RELEASE → RELEASED
     * - REFUND → DISPUTE_RESOLVED_REFUND → REFUNDED
     */
    @PostMapping("/{disputeId}/resolve")
    @Transactional
    public ResponseEntity<?> resolveDispute(
            @PathVariable UUID disputeId,
            @RequestHeader(value = "X-User-Id", required = false) UUID userId,
            @RequestHeader(value = "X-User-Role", required = false) String userRole,
            @RequestBody ResolveDisputeRequest request) {
        
        log.info("[DISPUTE_RESOLVE] Admin resolving dispute: disputeId={}, actor={}, role={}, decision={}", 
            disputeId, userId, userRole, request.decision());
        
        // STEP 6: Basic admin check (TODO: Replace with proper Spring Security)
        if (userRole == null || !"ADMIN".equalsIgnoreCase(userRole)) {
            log.warn("[DISPUTE_RESOLVE] Unauthorized: user role is not ADMIN (role={})", userRole);
            return ResponseEntity.status(403)
                .body(new ErrorResponse("Only ADMIN users can resolve disputes"));
        }
        
        try {
            // Find dispute
            Optional<MilestoneDispute> disputeOpt = disputeRepository.findById(disputeId);
            if (disputeOpt.isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(new ErrorResponse("Dispute not found: " + disputeId));
            }
            
            MilestoneDispute dispute = disputeOpt.get();
            
            // Validate dispute status
            if (dispute.getStatus() == MilestoneDispute.DisputeStatus.RESOLVED) {
                return ResponseEntity.badRequest()
                    .body(new ErrorResponse("Dispute already resolved"));
            }
            
            // Find milestone
            Optional<DealMilestone> milestoneOpt = milestoneRepository.findById(dispute.getMilestoneId());
            if (milestoneOpt.isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(new ErrorResponse("Milestone not found: " + dispute.getMilestoneId()));
            }
            
            DealMilestone milestone = milestoneOpt.get();
            
            // Validate milestone status
            if (milestone.getStatus() != DealMilestone.MilestoneStatus.DISPUTED &&
                milestone.getStatus() != DealMilestone.MilestoneStatus.DISPUTE_REVIEWING) {
                return ResponseEntity.badRequest()
                    .body(new ErrorResponse(
                        String.format("Milestone must be in DISPUTED or DISPUTE_REVIEWING status. Current: %s", 
                            milestone.getStatus())));
            }
            
            // STEP 6: Resolve dispute
            MilestoneDispute.DisputeResolution resolution = 
                "RELEASE".equalsIgnoreCase(request.decision()) 
                    ? MilestoneDispute.DisputeResolution.RELEASE
                    : MilestoneDispute.DisputeResolution.REFUND;
            
            dispute.resolve(resolution, request.note(), userId != null ? userId : UUID.randomUUID());
            disputeRepository.save(dispute);
            
            // STEP 6: Update milestone status based on resolution
            if (resolution == MilestoneDispute.DisputeResolution.RELEASE) {
                milestone.updateStatus(DealMilestone.MilestoneStatus.DISPUTE_RESOLVED_RELEASE);
                // Final transition to RELEASED
                milestone.updateStatus(DealMilestone.MilestoneStatus.RELEASED);
                escrowStateService.setMilestoneReleased(dispute.getDealId().toString(), 
                    dispute.getMilestoneId().toString());
            } else {
                milestone.updateStatus(DealMilestone.MilestoneStatus.DISPUTE_RESOLVED_REFUND);
                // Final transition to REFUNDED
                milestone.updateStatus(DealMilestone.MilestoneStatus.REFUNDED);
                escrowStateService.setMilestoneRefunded(dispute.getDealId().toString(), 
                    dispute.getMilestoneId().toString());
            }
            
            milestoneRepository.save(milestone);
            
            // STEP 7-B: Record on-chain based on resolution
            try {
                if (resolution == MilestoneDispute.DisputeResolution.RELEASE) {
                    blockchainService.recordMilestoneStatus(
                        dispute.getDealId(),
                        dispute.getMilestoneId(),
                        com.trustescrow.domain.model.OnChainRecord.RecordStatus.RELEASED,
                        "ADMIN"
                    );
                    log.info("[BLOCKCHAIN] RELEASED recorded on-chain (dispute resolution): dealId={}, milestoneId={}", 
                        dispute.getDealId(), dispute.getMilestoneId());
                } else {
                    blockchainService.recordMilestoneStatus(
                        dispute.getDealId(),
                        dispute.getMilestoneId(),
                        com.trustescrow.domain.model.OnChainRecord.RecordStatus.REFUNDED,
                        "ADMIN"
                    );
                    log.info("[BLOCKCHAIN] REFUNDED recorded on-chain (dispute resolution): dealId={}, milestoneId={}", 
                        dispute.getDealId(), dispute.getMilestoneId());
                }
            } catch (Exception e) {
                log.warn("[BLOCKCHAIN] Failed to record on-chain (non-critical): {}", e.getMessage());
            }
            
            // STEP 6: Record audit log
            String actor = userId != null ? userId.toString() : "admin";
            String payload = String.format(
                "{\"disputeId\":\"%s\",\"milestoneId\":\"%s\",\"decision\":\"%s\",\"note\":\"%s\"}",
                disputeId, dispute.getMilestoneId(), request.decision(), request.note()
            );
            
            AuditEvent auditEvent = AuditEvent.builder()
                .dealId(dispute.getDealId())
                .type(AuditEventType.DISPUTE_RESOLVED)
                .actor(actor)
                .payload(payload)
                .createdAt(Instant.now())
                .build();
            
            auditEventRepository.save(auditEvent);
            
            log.info("[DISPUTE_RESOLVE] Dispute resolved successfully: disputeId={}, decision={}", 
                disputeId, request.decision());
            
            return ResponseEntity.ok(new ResolveDisputeResponse(
                disputeId,
                dispute.getDealId(),
                dispute.getMilestoneId(),
                request.decision(),
                "Dispute resolved successfully"
            ));
            
        } catch (Exception e) {
            log.error("[DISPUTE_RESOLVE] Error resolving dispute: disputeId={}, error={}", 
                disputeId, e.getMessage(), e);
            return ResponseEntity.internalServerError()
                .body(new ErrorResponse("Failed to resolve dispute: " + e.getMessage()));
        }
    }
    
    /**
     * Request DTO for resolving dispute.
     */
    public record ResolveDisputeRequest(
        String decision,  // "RELEASE" or "REFUND"
        String note       // Admin's resolution note
    ) {}
    
    /**
     * Response DTO for dispute resolution.
     */
    public record ResolveDisputeResponse(
        UUID disputeId,
        UUID dealId,
        UUID milestoneId,
        String decision,
        String message
    ) {}
    
    /**
     * Error response DTO.
     */
    public record ErrorResponse(String error) {}
}
