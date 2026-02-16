package com.trustescrow.presentation.controller;

import com.trustescrow.application.dto.ApiResponse;
import com.trustescrow.application.service.TransactionService;
import com.trustescrow.domain.model.MilestoneFile;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
@Slf4j
public class FileController {
    
    private final TransactionService transactionService;
    
    @Data
    public static class FileUploadRequest {
        private UUID milestoneId;
        private String fileName;
        private Long fileSize;
        private String mimeType;
        private String uploaderRole;
        private Boolean simulated;
    }
    
    @PostMapping("/upload")
    public ResponseEntity<ApiResponse<Object>> uploadFile(
            @RequestBody FileUploadRequest request,
            @RequestHeader(value = "X-User-Role", required = false) String userRole) {
        
        MilestoneFile.UploaderRole uploaderRole = "BUYER".equals(request.getUploaderRole()) 
            ? MilestoneFile.UploaderRole.BUYER 
            : MilestoneFile.UploaderRole.SELLER;
        
        // Simulated upload - generate file URL without actual file storage
        String fileUrl = "/uploads/" + UUID.randomUUID() + "/" + request.getFileName();
        
        MilestoneFile saved = transactionService.saveFile(
            request.getMilestoneId(),
            fileUrl,
            request.getFileName(),
            request.getFileSize() != null ? request.getFileSize() : 0L,
            request.getMimeType() != null ? request.getMimeType() : "application/octet-stream",
            uploaderRole
        );
        
        return ResponseEntity.ok(ApiResponse.success(Map.of(
            "id", saved.getId(),
            "fileUrl", saved.getFileUrl(),
            "fileName", saved.getFileName()
        )));
    }
    
    @GetMapping("/{milestoneId}")
    public ResponseEntity<ApiResponse<List<Object>>> getFiles(@PathVariable UUID milestoneId) {
        List<MilestoneFile> files = transactionService.getFiles(milestoneId);
        
        List<Object> responses = files.stream()
            .map(f -> Map.of(
                "id", f.getId(),
                "fileName", f.getFileName() != null ? f.getFileName() : "",
                "fileUrl", f.getFileUrl(),
                "uploaderRole", f.getUploaderRole().name(),
                "createdAt", f.getCreatedAt()
            ))
            .collect(Collectors.toList());
        
        return ResponseEntity.ok(ApiResponse.success(responses));
    }
}
