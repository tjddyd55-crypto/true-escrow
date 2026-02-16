package com.trustescrow.presentation.controller;

import com.trustescrow.application.dto.ApiResponse;
import com.trustescrow.application.dto.TransactionResponse;
import com.trustescrow.application.service.TransactionService;
import com.trustescrow.domain.model.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/transactions")
@RequiredArgsConstructor
@Slf4j
public class TransactionController {
    
    private final TransactionService transactionService;
    
    @GetMapping
    public ResponseEntity<ApiResponse<List<TransactionResponse>>> getTransactions(
            @RequestHeader(value = "X-User-Id", required = false) UUID userId,
            @RequestHeader(value = "X-User-Role", required = false) String userRole) {
        
        List<Transaction> transactions;
        if ("ADMIN".equals(userRole)) {
            transactions = transactionService.getAllTransactions();
        } else if (userId != null) {
            if ("SELLER".equals(userRole)) {
                transactions = transactionService.getTransactionsBySeller(userId);
            } else {
                // Default to buyer
                transactions = transactionService.getTransactionsByBuyer(userId);
            }
        } else {
            transactions = Collections.emptyList();
        }
        
        List<TransactionResponse> responses = transactions.stream()
            .map(TransactionResponse::from)
            .collect(Collectors.toList());
        
        return ResponseEntity.ok(ApiResponse.success(responses));
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TransactionResponse>> getTransaction(@PathVariable UUID id) {
        Transaction transaction = transactionService.getTransaction(id)
            .orElseThrow(() -> new RuntimeException("Transaction not found"));
        
        TransactionResponse response = TransactionResponse.from(transaction);
        
        // Enrich with milestones
        List<TransactionMilestone> milestones = transactionService.getMilestones(id);
        response.setMilestones(milestones.stream()
            .map(m -> {
                List<MilestoneFile> files = transactionService.getFiles(m.getId());
                return TransactionResponse.MilestoneResponse.builder()
                    .id(m.getId())
                    .title(m.getTitle())
                    .amount(m.getAmount().toString())
                    .status(m.getStatus().name())
                    .orderIndex(m.getOrderIndex())
                    .files(files.stream()
                        .map(f -> TransactionResponse.FileResponse.builder()
                            .id(f.getId())
                            .fileName(f.getFileName())
                            .fileUrl(f.getFileUrl())
                            .uploaderRole(f.getUploaderRole().name())
                            .createdAt(f.getCreatedAt())
                            .build())
                        .collect(Collectors.toList()))
                    .build();
            })
            .collect(Collectors.toList()));
        
        // Enrich with activity logs
        List<ActivityLog> logs = transactionService.getActivityLogs(id);
        response.setActivityLogs(logs.stream()
            .map(l -> TransactionResponse.ActivityLogResponse.builder()
                .id(l.getId())
                .actorRole(l.getActorRole().name())
                .action(l.getAction())
                .meta(l.getMeta())
                .createdAt(l.getCreatedAt())
                .build())
            .collect(Collectors.toList()));
        
        return ResponseEntity.ok(ApiResponse.success(response));
    }
    
    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<TransactionResponse>> updateStatus(
            @PathVariable UUID id,
            @RequestBody Map<String, String> request,
            @RequestHeader(value = "X-User-Role", required = false) String userRole) {
        
        if (!"ADMIN".equals(userRole)) {
            return ResponseEntity.status(403).build();
        }
        
        String statusStr = request.get("status");
        Transaction.TransactionStatus status = Transaction.TransactionStatus.valueOf(statusStr);
        Transaction updated = transactionService.updateTransactionStatus(id, status);
        
        return ResponseEntity.ok(ApiResponse.success(TransactionResponse.from(updated)));
    }
}
