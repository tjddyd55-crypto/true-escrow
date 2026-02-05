package com.trustescrow.presentation.controller;

import com.trustescrow.application.dto.ApiResponse;
import com.trustescrow.application.service.TransactionService;
import com.trustescrow.domain.model.ActivityLog;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/activity")
@RequiredArgsConstructor
@Slf4j
public class ActivityController {
    
    private final TransactionService transactionService;
    
    @GetMapping("/{transactionId}")
    public ResponseEntity<ApiResponse<List<Object>>> getActivityLogs(@PathVariable UUID transactionId) {
        List<ActivityLog> logs = transactionService.getActivityLogs(transactionId);
        
        List<Object> responses = logs.stream()
            .map(l -> Map.of(
                "id", l.getId(),
                "actorRole", l.getActorRole().name(),
                "action", l.getAction(),
                "meta", l.getMeta() != null ? l.getMeta() : Map.of(),
                "createdAt", l.getCreatedAt()
            ))
            .collect(Collectors.toList());
        
        return ResponseEntity.ok(ApiResponse.success(responses));
    }
}
