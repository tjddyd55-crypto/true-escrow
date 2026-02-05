package com.trustescrow.presentation.controller;

import com.trustescrow.application.dto.ApiResponse;
import com.trustescrow.application.service.TransactionBuilderService;
import com.trustescrow.domain.model.*;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/transaction-builder")
@RequiredArgsConstructor
@Slf4j
public class TransactionBuilderController {
    
    private final TransactionBuilderService builderService;
    
    @PostMapping("/transactions")
    public ResponseEntity<ApiResponse<Map<String, Object>>> createTransaction(
            @RequestBody CreateTransactionRequest request,
            @RequestHeader(value = "X-User-Id", required = false) UUID userId) {
        
        UUID initiatorId = userId != null ? userId : UUID.randomUUID();
        
        Transaction transaction = builderService.createTransaction(
            request.getTitle(),
            request.getDescription(),
            initiatorId,
            Transaction.InitiatorRole.valueOf(request.getInitiatorRole()),
            request.getBuyerId(),
            request.getSellerId()
        );
        
        return ResponseEntity.ok(ApiResponse.success(Map.of(
            "id", transaction.getId(),
            "title", transaction.getTitle(),
            "status", transaction.getStatus().name()
        )));
    }
    
    @PostMapping("/transactions/{transactionId}/blocks")
    public ResponseEntity<ApiResponse<Map<String, Object>>> createBlock(
            @PathVariable UUID transactionId,
            @RequestBody CreateBlockRequest request) {
        
        Block block = builderService.createBlock(
            transactionId,
            request.getTitle(),
            request.getStartDay(),
            request.getEndDay(),
            request.getOrderIndex(),
            ApprovalPolicy.ApprovalType.valueOf(request.getApprovalType()),
            request.getThreshold()
        );
        
        return ResponseEntity.ok(ApiResponse.success(Map.of(
            "id", block.getId(),
            "title", block.getTitle(),
            "orderIndex", block.getOrderIndex()
        )));
    }
    
    @PostMapping("/blocks/{blockId}/approvers")
    public ResponseEntity<ApiResponse<Map<String, Object>>> addApprover(
            @PathVariable UUID blockId,
            @RequestBody AddApproverRequest request) {
        
        BlockApprover approver = builderService.addApprover(
            blockId,
            BlockApprover.ApproverRole.valueOf(request.getRole()),
            request.getUserId(),
            request.getRequired()
        );
        
        return ResponseEntity.ok(ApiResponse.success(Map.of(
            "id", approver.getId(),
            "role", approver.getRole().name()
        )));
    }
    
    @PostMapping("/blocks/{blockId}/work-rules")
    public ResponseEntity<ApiResponse<Map<String, Object>>> createWorkRule(
            @PathVariable UUID blockId,
            @RequestBody CreateWorkRuleRequest request) {
        
        WorkRule workRule = builderService.createWorkRule(
            blockId,
            WorkRule.WorkType.valueOf(request.getWorkType()),
            request.getDescription(),
            request.getQuantity(),
            WorkRule.Frequency.valueOf(request.getFrequency()),
            request.getDueDates()
        );
        
        return ResponseEntity.ok(ApiResponse.success(Map.of(
            "id", workRule.getId(),
            "workType", workRule.getWorkType().name()
        )));
    }
    
    @PostMapping("/transactions/{transactionId}/activate")
    public ResponseEntity<ApiResponse<Map<String, Object>>> activateTransaction(
            @PathVariable UUID transactionId) {
        
        builderService.activateTransaction(transactionId);
        
        return ResponseEntity.ok(ApiResponse.success(Map.of(
            "message", "Transaction activated",
            "transactionId", transactionId
        )));
    }
    
    @GetMapping("/transactions/{transactionId}/blocks")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getBlocks(
            @PathVariable UUID transactionId) {
        
        List<Block> blocks = builderService.getBlocks(transactionId);
        List<Map<String, Object>> response = blocks.stream()
            .map(b -> {
                Map<String, Object> map = new java.util.HashMap<>();
                map.put("id", b.getId());
                map.put("title", b.getTitle());
                map.put("startDay", b.getStartDay());
                map.put("endDay", b.getEndDay());
                map.put("orderIndex", b.getOrderIndex());
                map.put("isActive", b.getIsActive());
                return map;
            })
            .toList();
        
        return ResponseEntity.ok(ApiResponse.success(response));
    }
    
    // DTOs
    @Data
    public static class CreateTransactionRequest {
        private String title;
        private String description;
        private String initiatorRole;
        private UUID buyerId;
        private UUID sellerId;
    }
    
    @Data
    public static class CreateBlockRequest {
        private String title;
        private Integer startDay;
        private Integer endDay;
        private Integer orderIndex;
        private String approvalType;
        private Integer threshold;
    }
    
    @Data
    public static class AddApproverRequest {
        private String role;
        private UUID userId;
        private Boolean required;
    }
    
    @Data
    public static class CreateWorkRuleRequest {
        private String workType;
        private String description;
        private Integer quantity;
        private String frequency;
        private List<Integer> dueDates;
    }
}
