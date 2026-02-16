package com.trustescrow.presentation.controller;

import com.trustescrow.domain.model.AuditEvent;
import com.trustescrow.domain.model.AuditEventType;
import com.trustescrow.domain.model.Deal;
import com.trustescrow.domain.model.DealMilestone;
import com.trustescrow.domain.model.EvidenceMetadata;
import com.trustescrow.domain.model.EvidenceType;
import com.trustescrow.domain.service.AuditEventRepository;
import com.trustescrow.domain.service.DealMilestoneRepository;
import com.trustescrow.domain.service.DealRepository;
import com.trustescrow.domain.service.EvidenceRepository;
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
 * MASTER TASK STEP 2: Milestone Evidence Upload API
 * 
 * Handles evidence upload for milestones.
 * 
 * Rules:
 * - Upload allowed only when milestone.status === FUNDS_HELD
 * - Upload by: BUYER or SELLER
 * - After upload: milestone.status → EVIDENCE_SUBMITTED
 * - Evidence is immutable: no edit, no delete, no overwrite
 */
@RestController
@RequestMapping("/api/deals")
@RequiredArgsConstructor
@Slf4j
public class MilestoneEvidenceController {
    
    private final DealRepository dealRepository;
    private final DealMilestoneRepository milestoneRepository;
    private final EvidenceRepository evidenceRepository;
    private final AuditEventRepository auditEventRepository;
    private final EscrowStateService escrowStateService;
    
    /**
     * MASTER TASK STEP 2: Upload evidence for a milestone.
     * 
     * POST /api/deals/{dealId}/milestones/{milestoneId}/evidence
     * 
     * Request body:
     * {
     *   "type": "IMAGE" | "PDF",
     *   "url": "https://...",
     *   "uploadedBy": "BUYER" | "SELLER"
     * }
     * 
     * Rules:
     * - milestone.status === FUNDS_HELD or PAID_HELD
     * - After upload: status → EVIDENCE_SUBMITTED
     * - Evidence is immutable (no edit/delete)
     */
    @PostMapping("/{dealId}/milestones/{milestoneId}/evidence")
    @Transactional
    public ResponseEntity<?> uploadEvidence(
            @PathVariable UUID dealId,
            @PathVariable UUID milestoneId,
            @RequestHeader(value = "X-User-Id", required = false) UUID userId,
            @RequestBody UploadEvidenceRequest request) {
        
        log.info("[EVIDENCE] Upload evidence: dealId={}, milestoneId={}, uploadedBy={}", 
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
            
            // MASTER TASK: Validate milestone status === FUNDS_HELD or PAID_HELD
            if (milestone.getStatus() != DealMilestone.MilestoneStatus.FUNDS_HELD &&
                milestone.getStatus() != DealMilestone.MilestoneStatus.PAID_HELD) {
                return ResponseEntity.badRequest()
                    .body(new ErrorResponse(
                        String.format("Evidence can only be uploaded when milestone is in FUNDS_HELD or PAID_HELD status. Current: %s", 
                            milestone.getStatus())));
            }
            
            // MASTER TASK: Create evidence record (immutable)
            EvidenceMetadata evidence = EvidenceMetadata.builder()
                .dealId(dealId)
                .milestoneId(milestoneId)
                .uploadedBy(userId != null ? userId : UUID.randomUUID()) // TODO: Get from auth
                .type(EvidenceType.valueOf(request.type()))
                .uri(request.url())
                .createdAt(Instant.now())
                .build();
            
            evidenceRepository.save(evidence);
            
            // MASTER TASK: Update milestone status → EVIDENCE_SUBMITTED
            // Only if not already in EVIDENCE_SUBMITTED status
            if (milestone.getStatus() != DealMilestone.MilestoneStatus.EVIDENCE_SUBMITTED) {
                milestone.updateStatus(DealMilestone.MilestoneStatus.EVIDENCE_SUBMITTED);
                milestoneRepository.save(milestone);
                
                // Update in-memory state
                escrowStateService.setMilestoneEvidenceSubmitted(dealId.toString(), milestoneId.toString());
            }
            
            // MASTER TASK STEP 6: Record audit log with before/after status
            String actor = userId != null ? userId.toString() : "anonymous";
            String beforeStatus = milestone.getStatus() == DealMilestone.MilestoneStatus.EVIDENCE_SUBMITTED 
                ? "EVIDENCE_SUBMITTED" 
                : milestone.getStatus().name();
            String payload = String.format(
                "{\"action\":\"EVIDENCE_UPLOAD\",\"evidenceId\":\"%s\",\"milestoneId\":\"%s\",\"type\":\"%s\",\"url\":\"%s\",\"before\":\"%s\",\"after\":\"EVIDENCE_SUBMITTED\"}",
                evidence.getId(), milestoneId, request.type(), request.url(), beforeStatus
            );
            
            AuditEvent auditEvent = AuditEvent.builder()
                .dealId(dealId)
                .type(AuditEventType.STATE_TRANSITION)
                .actor(actor)
                .payload(payload)
                .createdAt(Instant.now())
                .build();
            
            auditEventRepository.save(auditEvent);
            log.info("[AUDIT] Evidence upload logged: dealId={}, milestoneId={}, actor={}, before={}, after=EVIDENCE_SUBMITTED", 
                dealId, milestoneId, actor, beforeStatus);
            
            log.info("[EVIDENCE] Evidence uploaded successfully: evidenceId={}, milestoneId={}, status={}", 
                evidence.getId(), milestoneId, milestone.getStatus());
            
            return ResponseEntity.ok(new EvidenceResponse(
                evidence.getId(),
                dealId,
                milestoneId,
                request.type(),
                request.url(),
                "Evidence uploaded successfully"
            ));
            
        } catch (Exception e) {
            log.error("[EVIDENCE] Error uploading evidence: dealId={}, milestoneId={}, error={}", 
                dealId, milestoneId, e.getMessage(), e);
            return ResponseEntity.internalServerError()
                .body(new ErrorResponse("Failed to upload evidence: " + e.getMessage()));
        }
    }
    
    /**
     * MASTER TASK STEP 2: Get evidence for a milestone.
     * 
     * GET /api/deals/{dealId}/milestones/{milestoneId}/evidence
     */
    @GetMapping("/{dealId}/milestones/{milestoneId}/evidence")
    public ResponseEntity<?> getEvidence(
            @PathVariable UUID dealId,
            @PathVariable UUID milestoneId) {
        
        log.info("[EVIDENCE] Get evidence: dealId={}, milestoneId={}", dealId, milestoneId);
        
        try {
            List<EvidenceMetadata> evidenceList = evidenceRepository
                .findByDealIdAndMilestoneIdOrderByCreatedAtDesc(dealId, milestoneId);
            
            List<EvidenceInfo> evidenceInfoList = evidenceList.stream()
                .map(e -> new EvidenceInfo(
                    e.getId(),
                    e.getType().name(),
                    e.getUri(),
                    e.getUploadedBy(),
                    e.getCreatedAt()
                ))
                .toList();
            
            return ResponseEntity.ok(new EvidenceListResponse(evidenceInfoList));
            
        } catch (Exception e) {
            log.error("[EVIDENCE] Error fetching evidence: dealId={}, milestoneId={}, error={}", 
                dealId, milestoneId, e.getMessage(), e);
            return ResponseEntity.internalServerError()
                .body(new ErrorResponse("Failed to fetch evidence: " + e.getMessage()));
        }
    }
    
    /**
     * Request DTO for uploading evidence.
     */
    public record UploadEvidenceRequest(
        String type,  // "IMAGE" | "PDF"
        String url    // Evidence URL
    ) {}
    
    /**
     * Response DTO for evidence upload.
     */
    public record EvidenceResponse(
        UUID evidenceId,
        UUID dealId,
        UUID milestoneId,
        String type,
        String url,
        String message
    ) {}
    
    /**
     * Response DTO for evidence list.
     */
    public record EvidenceListResponse(
        List<EvidenceInfo> evidence
    ) {}
    
    /**
     * Evidence info DTO.
     */
    public record EvidenceInfo(
        UUID id,
        String type,
        String url,
        UUID uploadedBy,
        Instant uploadedAt
    ) {}
    
    /**
     * Error response DTO.
     */
    public record ErrorResponse(String error) {}
}
