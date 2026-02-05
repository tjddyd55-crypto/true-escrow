package com.trustescrow.presentation.controller;

import com.trustescrow.application.dto.ApiResponse;
import com.trustescrow.application.service.TransactionService;
import com.trustescrow.domain.model.MilestoneFile;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

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
    
    @PostMapping("/upload")
    public ResponseEntity<ApiResponse<Object>> uploadFile(
            @RequestParam("milestoneId") UUID milestoneId,
            @RequestParam("file") MultipartFile file,
            @RequestHeader(value = "X-User-Role", required = false) String userRole) {
        
        MilestoneFile.UploaderRole uploaderRole = "BUYER".equals(userRole) 
            ? MilestoneFile.UploaderRole.BUYER 
            : MilestoneFile.UploaderRole.SELLER;
        
        // For demo, just save file info (actual file storage would be implemented separately)
        String fileUrl = "/uploads/" + UUID.randomUUID() + "/" + file.getOriginalFilename();
        
        MilestoneFile saved = transactionService.saveFile(
            milestoneId,
            fileUrl,
            file.getOriginalFilename(),
            file.getSize(),
            file.getContentType(),
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
