package com.trustescrow.presentation.controller;

import com.trustescrow.application.dto.*;
import com.trustescrow.application.service.DealApplicationService;
import com.trustescrow.domain.model.Deal;
import com.trustescrow.domain.service.ContractInstanceRepository;
import com.trustescrow.domain.service.TimelineService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/deals")
@RequiredArgsConstructor
public class DealController {
    
    private final DealApplicationService dealService;
    private final TimelineService timelineService;
    private final ContractInstanceRepository instanceRepository;
    private final com.trustescrow.application.service.EscrowStateService escrowStateService;
    
    @PostMapping
    public ResponseEntity<ApiResponse<DealResponse>> createDeal(
        @Valid @RequestBody CreateDealRequest request,
        @RequestHeader(value = "X-User-Id", required = false) UUID userId,
        @RequestHeader(value = "X-Idempotency-Key", required = false) String idempotencyKey
    ) {
        UUID actorId = userId != null ? userId : UUID.randomUUID(); // TODO: get from auth
        
        Deal deal = dealService.createDeal(request, actorId);
        DealResponse response = DealResponse.from(deal);
        
        // Get rule version from contract instance per SSOT
        String ruleVersion = instanceRepository.findByDealId(deal.getId())
            .map(instance -> String.valueOf(instance.getTemplateVersion()))
            .orElse(null);
        
        ApiResponse.ResponseMeta meta = ApiResponse.ResponseMeta.builder()
            .ruleVersion(ruleVersion)
            .idempotencyKey(idempotencyKey)
            .actionsExecuted(new ArrayList<>()) // No actions on creation
            .build();
        
        return ResponseEntity.ok(ApiResponse.success(response, meta));
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<DealResponse>> getDeal(@PathVariable UUID id) {
        Deal deal = dealService.getDeal(id);
        DealResponse response = DealResponse.from(deal);
        
        // Add milestone status from in-memory escrow state
        String dealIdStr = id.toString();
        var milestones = escrowStateService.getDealMilestones(dealIdStr);
        
        // Convert to milestone list for response
        var milestoneList = milestones.entrySet().stream()
            .map(entry -> new DealResponse.MilestoneInfo(
                entry.getKey(),
                entry.getValue().getStatus()
            ))
            .toList();
        
        response.setMilestones(milestoneList);
        
        return ResponseEntity.ok(ApiResponse.success(response));
    }
    
    @PostMapping("/{id}/fund")
    public ResponseEntity<ApiResponse<Void>> fundDeal(
        @PathVariable UUID id,
        @RequestHeader(value = "X-User-Id", required = false) UUID userId,
        @RequestHeader(value = "X-Idempotency-Key", required = false) String idempotencyKey
    ) {
        UUID actorId = userId != null ? userId : UUID.randomUUID();
        
        dealService.fundDeal(id, actorId);
        
        // Get rule version from contract instance per SSOT
        String ruleVersion = instanceRepository.findByDealId(id)
            .map(instance -> String.valueOf(instance.getTemplateVersion()))
            .orElse(null);
        
        // Fund action creates HOLD entries (tracked via ledger, not rules engine)
        List<String> actionsExecuted = List.of("HOLD:holdback", "HOLD:immediate");
        
        ApiResponse.ResponseMeta meta = ApiResponse.ResponseMeta.builder()
            .ruleVersion(ruleVersion)
            .idempotencyKey(idempotencyKey)
            .actionsExecuted(actionsExecuted)
            .build();
        
        return ResponseEntity.ok(ApiResponse.success(null, meta));
    }
    
    @PostMapping("/{id}/deliver")
    public ResponseEntity<ApiResponse<Void>> deliverDeal(
        @PathVariable UUID id,
        @RequestHeader(value = "X-User-Id", required = false) UUID userId,
        @RequestHeader(value = "X-Idempotency-Key", required = false) String idempotencyKey
    ) {
        UUID actorId = userId != null ? userId : UUID.randomUUID();
        
        dealService.deliverDeal(id, actorId);
        
        // Get rule version from contract instance per SSOT
        String ruleVersion = instanceRepository.findByDealId(id)
            .map(instance -> String.valueOf(instance.getTemplateVersion()))
            .orElse(null);
        
        // Deliver action creates RELEASE immediate entry
        List<String> actionsExecuted = List.of("RELEASE:immediate");
        
        ApiResponse.ResponseMeta meta = ApiResponse.ResponseMeta.builder()
            .ruleVersion(ruleVersion)
            .idempotencyKey(idempotencyKey)
            .actionsExecuted(actionsExecuted)
            .build();
        
        return ResponseEntity.ok(ApiResponse.success(null, meta));
    }
    
    @PostMapping("/{id}/approve")
    public ResponseEntity<ApiResponse<Void>> approveDeal(
        @PathVariable UUID id,
        @RequestHeader(value = "X-User-Id", required = false) UUID userId,
        @RequestHeader(value = "X-Idempotency-Key", required = false) String idempotencyKey
    ) {
        UUID actorId = userId != null ? userId : UUID.randomUUID();
        
        var result = dealService.approveDeal(id, actorId);
        
        // Get rule version from contract instance per SSOT
        String ruleVersion = instanceRepository.findByDealId(id)
            .map(instance -> String.valueOf(instance.getTemplateVersion()))
            .orElse(null);
        
        // Extract actions executed from result
        List<String> actionsExecuted = result != null && result.getActions() != null
            ? result.getActions().stream()
                .map(action -> action.getType().name() + ":" + action.getAmount())
                .collect(Collectors.toList())
            : new ArrayList<>();
        
        ApiResponse.ResponseMeta meta = ApiResponse.ResponseMeta.builder()
            .ruleVersion(ruleVersion)
            .idempotencyKey(idempotencyKey)
            .actionsExecuted(actionsExecuted)
            .build();
        
        return ResponseEntity.ok(ApiResponse.success(null, meta));
    }
    
    @PostMapping("/{id}/issue")
    public ResponseEntity<ApiResponse<Void>> raiseIssue(
        @PathVariable UUID id,
        @Valid @RequestBody IssueRequest request,
        @RequestHeader(value = "X-User-Id", required = false) UUID userId,
        @RequestHeader(value = "X-Idempotency-Key", required = false) String idempotencyKey
    ) {
        UUID actorId = userId != null ? userId : UUID.randomUUID();
        
        dealService.raiseIssue(id, request, actorId);
        
        // Get rule version from contract instance per SSOT
        String ruleVersion = instanceRepository.findByDealId(id)
            .map(instance -> String.valueOf(instance.getTemplateVersion()))
            .orElse(null);
        
        // Issue creation creates dispute (no ledger actions yet)
        List<String> actionsExecuted = List.of("DISPUTE_OPENED");
        
        ApiResponse.ResponseMeta meta = ApiResponse.ResponseMeta.builder()
            .ruleVersion(ruleVersion)
            .idempotencyKey(idempotencyKey)
            .actionsExecuted(actionsExecuted)
            .build();
        
        return ResponseEntity.ok(ApiResponse.success(null, meta));
    }
    
    @GetMapping("/{id}/timeline")
    public ResponseEntity<ApiResponse<TimelineService.DealTimeline>> getTimeline(@PathVariable UUID id) {
        TimelineService.DealTimeline timeline = timelineService.getTimeline(id);
        return ResponseEntity.ok(ApiResponse.success(timeline));
    }
}
