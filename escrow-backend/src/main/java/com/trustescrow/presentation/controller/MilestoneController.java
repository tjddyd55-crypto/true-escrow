package com.trustescrow.presentation.controller;

import com.trustescrow.application.dto.ApiResponse;
import com.trustescrow.application.service.TransactionService;
import com.trustescrow.domain.model.TransactionMilestone;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/milestones")
@RequiredArgsConstructor
@Slf4j
public class MilestoneController {
    
    private final TransactionService transactionService;
    
    @GetMapping("/{transactionId}")
    public ResponseEntity<ApiResponse<List<Object>>> getMilestones(@PathVariable UUID transactionId) {
        List<TransactionMilestone> milestones = transactionService.getMilestones(transactionId);
        
        List<Object> responses = milestones.stream()
            .map(m -> Map.of(
                "id", m.getId(),
                "title", m.getTitle(),
                "amount", m.getAmount().toString(),
                "status", m.getStatus().name(),
                "orderIndex", m.getOrderIndex()
            ))
            .collect(Collectors.toList());
        
        return ResponseEntity.ok(ApiResponse.success(responses));
    }
    
    @PostMapping("/{id}/submit")
    public ResponseEntity<ApiResponse<Object>> submitMilestone(
            @PathVariable UUID id,
            @RequestHeader(value = "X-User-Role", required = false) String userRole) {
        
        if (!"SELLER".equals(userRole)) {
            return ResponseEntity.status(403).build();
        }
        
        TransactionMilestone milestone = transactionService.submitMilestone(id);
        
        return ResponseEntity.ok(ApiResponse.success(Map.of(
            "id", milestone.getId(),
            "status", milestone.getStatus().name()
        )));
    }
    
    @PostMapping("/{id}/approve")
    public ResponseEntity<ApiResponse<Object>> approveMilestone(
            @PathVariable UUID id,
            @RequestHeader(value = "X-User-Role", required = false) String userRole) {
        
        if (!"BUYER".equals(userRole)) {
            return ResponseEntity.status(403).build();
        }
        
        TransactionMilestone milestone = transactionService.approveMilestone(id);
        
        return ResponseEntity.ok(ApiResponse.success(Map.of(
            "id", milestone.getId(),
            "status", milestone.getStatus().name()
        )));
    }
}
