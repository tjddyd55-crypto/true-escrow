package com.trustescrow.presentation.controller;

import com.trustescrow.application.dto.ApiResponse;
import com.trustescrow.domain.model.DisputeCase;
import com.trustescrow.domain.service.AdminService;
import com.trustescrow.domain.service.ContractInstanceRepository;
import com.trustescrow.domain.service.DisputeCaseRepository;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {
    
    private final AdminService adminService;
    private final DisputeCaseRepository disputeRepository;
    private final ContractInstanceRepository instanceRepository;
    
    @GetMapping("/disputes")
    public ResponseEntity<ApiResponse<List<DisputeCase>>> listDisputes(
        @RequestParam(required = false) DisputeCase.DisputeStatus status
    ) {
        List<DisputeCase> disputes = adminService.listDisputes(status);
        return ResponseEntity.ok(ApiResponse.success(disputes));
    }
    
    @PostMapping("/disputes/{id}/resolve")
    public ResponseEntity<ApiResponse<Void>> resolveDispute(
        @PathVariable UUID id,
        @RequestBody ResolveDisputeRequest request,
        @RequestHeader(value = "X-User-Id", required = false) UUID adminId,
        @RequestHeader(value = "X-Idempotency-Key", required = false) String idempotencyKey
    ) {
        UUID actorId = adminId != null ? adminId : UUID.randomUUID();
        
        var result = adminService.resolveDispute(id, request.getOutcome(), actorId);
        
        // Get deal ID from dispute to find contract instance
        DisputeCase dispute = disputeRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Dispute not found: " + id));
        
        // Get rule version from contract instance per SSOT
        String ruleVersion = instanceRepository.findByDealId(dispute.getDealId())
            .map(instance -> String.valueOf(instance.getTemplateVersion()))
            .orElse(null);
        
        // Extract actions executed from result
        List<String> actionsExecuted = result != null && result.getActions() != null
            ? result.getActions().stream()
                .map(action -> action.getType().name() + ":" + action.getAmount())
                .toList()
            : new ArrayList<>();
        
        ApiResponse.ResponseMeta meta = ApiResponse.ResponseMeta.builder()
            .ruleVersion(ruleVersion)
            .idempotencyKey(idempotencyKey)
            .actionsExecuted(actionsExecuted)
            .build();
        
        return ResponseEntity.ok(ApiResponse.success(null, meta));
    }
    
    @PostMapping("/deals/{id}/override")
    public ResponseEntity<ApiResponse<Void>> overrideDeal(
        @PathVariable UUID id,
        @RequestBody OverrideDealRequest request,
        @RequestHeader(value = "X-User-Id", required = false) UUID adminId,
        @RequestHeader(value = "X-Idempotency-Key", required = false) String idempotencyKey
    ) {
        UUID actorId = adminId != null ? adminId : UUID.randomUUID();
        
        adminService.overrideDeal(id, request.getReason(), request.getExplanation(), actorId);
        
        // Get rule version from contract instance per SSOT
        String ruleVersion = instanceRepository.findByDealId(id)
            .map(instance -> String.valueOf(instance.getTemplateVersion()))
            .orElse(null);
        
        // Admin override may trigger actions (tracked via audit, not rules engine)
        List<String> actionsExecuted = List.of("ADMIN_OVERRIDE");
        
        ApiResponse.ResponseMeta meta = ApiResponse.ResponseMeta.builder()
            .ruleVersion(ruleVersion)
            .idempotencyKey(idempotencyKey)
            .actionsExecuted(actionsExecuted)
            .build();
        
        return ResponseEntity.ok(ApiResponse.success(null, meta));
    }
    
    @Data
    public static class ResolveDisputeRequest {
        private String outcome;
    }
    
    @Data
    public static class OverrideDealRequest {
        private String reason;
        private String explanation;
    }
}
