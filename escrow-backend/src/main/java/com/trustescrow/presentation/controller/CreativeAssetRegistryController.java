package com.trustescrow.presentation.controller;

import com.trustescrow.application.dto.ApiResponse;
import com.trustescrow.application.service.CreativeAssetRegistryService;
import com.trustescrow.application.service.EvidenceExportService;
import com.trustescrow.domain.model.*;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

/**
 * Creative Asset Registry Controller for Registry Extension.
 * 
 * CRITICAL: This API provides neutral record-keeping only.
 * Does NOT provide copyright protection guarantees or legal validity.
 * 
 * Position: "This asset existed at this time in this form" - fact recording only.
 */
@RestController
@RequestMapping("/v1/assets")
@RequiredArgsConstructor
@Slf4j
public class CreativeAssetRegistryController {
    
    private final CreativeAssetRegistryService registryService;
    private final EvidenceExportService evidenceService;
    
    /**
     * Register a new creative asset.
     * 
     * POST /v1/assets
     */
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<AssetRegistrationResponse>> registerAsset(
            @RequestParam("escrow_account_id") UUID escrowAccountId,
            @RequestParam("asset_type") String assetTypeStr,
            @RequestParam("visibility") String visibilityStr,
            @RequestParam("declared_creation_type") String declaredCreationTypeStr,
            @RequestParam(value = "file", required = false) MultipartFile file,
            @RequestParam(value = "text", required = false) String text,
            @RequestParam(value = "payload_meta", required = false) String payloadMeta) {
        
        log.info("Registering asset for account: {}", escrowAccountId);
        
        // Parse enums
        CreativeAsset.AssetType assetType = CreativeAsset.AssetType.valueOf(assetTypeStr.toUpperCase());
        CreativeAsset.Visibility visibility = CreativeAsset.Visibility.valueOf(visibilityStr.toUpperCase());
        CreativeAsset.DeclaredCreationType declaredCreationType = 
            CreativeAsset.DeclaredCreationType.valueOf(declaredCreationTypeStr.toUpperCase());
        
        // Get content
        byte[] content;
        if (file != null && !file.isEmpty()) {
            try {
                content = file.getBytes();
            } catch (Exception e) {
                throw new IllegalArgumentException("Failed to read file content", e);
            }
        } else if (text != null && !text.isEmpty()) {
            content = text.getBytes();
        } else {
            throw new IllegalArgumentException("Either 'file' or 'text' must be provided");
        }
        
        // Register asset
        CreativeAssetRegistryService.AssetRegistrationResult result = 
            registryService.registerAsset(
                escrowAccountId,
                assetType,
                visibility,
                declaredCreationType,
                content,
                payloadMeta
            );
        
        AssetRegistrationResponse response = AssetRegistrationResponse.builder()
            .assetId(result.getAssetId())
            .versionId(result.getVersionId())
            .contentHash(result.getContentHash())
            .createdAt(result.getCreatedAt())
            .build();
        
        return ResponseEntity.ok(ApiResponse.success(response));
    }
    
    /**
     * Get asset by ID.
     * 
     * GET /v1/assets/{asset_id}
     */
    @GetMapping("/{asset_id}")
    public ResponseEntity<ApiResponse<AssetResponse>> getAsset(@PathVariable("asset_id") UUID assetId) {
        CreativeAsset asset = registryService.getAsset(assetId);
        AssetResponse response = AssetResponse.from(asset);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
    
    /**
     * Add a new version to an asset.
     * 
     * POST /v1/assets/{asset_id}/versions
     */
    @PostMapping(value = "/{asset_id}/versions", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<VersionResponse>> addVersion(
            @PathVariable("asset_id") UUID assetId,
            @RequestParam(value = "file", required = false) MultipartFile file,
            @RequestParam(value = "text", required = false) String text,
            @RequestParam(value = "payload_meta", required = false) String payloadMeta) {
        
        log.info("Adding version to asset: {}", assetId);
        
        // Get content
        byte[] content;
        if (file != null && !file.isEmpty()) {
            try {
                content = file.getBytes();
            } catch (Exception e) {
                throw new IllegalArgumentException("Failed to read file content", e);
            }
        } else if (text != null && !text.isEmpty()) {
            content = text.getBytes();
        } else {
            throw new IllegalArgumentException("Either 'file' or 'text' must be provided");
        }
        
        AssetVersion version = registryService.addVersion(assetId, content, payloadMeta);
        VersionResponse response = VersionResponse.from(version);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
    
    /**
     * Get evidence package (JSON or PDF).
     * 
     * GET /v1/assets/{asset_id}/evidence?format=json|pdf
     */
    @GetMapping("/{asset_id}/evidence")
    public ResponseEntity<?> getEvidence(
            @PathVariable("asset_id") UUID assetId,
            @RequestParam(value = "format", defaultValue = "json") String format) {
        
        log.info("Generating evidence for asset: {}, format: {}", assetId, format);
        
        EvidenceExportService.EvidencePackage evidence = evidenceService.generateEvidence(assetId);
        
        if ("pdf".equalsIgnoreCase(format)) {
            String pdfContent = evidenceService.generatePdf(evidence);
            return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_PDF_VALUE)
                .header(HttpHeaders.CONTENT_DISPOSITION, 
                    "attachment; filename=\"evidence_" + assetId + ".pdf\"")
                .body(pdfContent);
        } else {
            String jsonContent = evidenceService.generateJson(evidence);
            return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .body(jsonContent);
        }
    }
    
    /**
     * Record a reference to an asset.
     * 
     * POST /v1/references
     */
    @PostMapping(value = "/../references", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ApiResponse<ReferenceResponse>> recordReference(@RequestBody ReferenceRequest request) {
        log.info("Recording reference for asset: {} in context: {}:{}", 
            request.getAssetId(), request.getContextType(), request.getContextId());
        
        AssetReference.ContextType contextType = 
            AssetReference.ContextType.valueOf(request.getContextType().toUpperCase());
        
        registryService.recordReference(
            request.getAssetId(),
            contextType,
            request.getContextId(),
            request.getContextMeta()
        );
        
        ReferenceResponse response = ReferenceResponse.builder()
            .assetId(request.getAssetId())
            .contextType(request.getContextType())
            .contextId(request.getContextId())
            .build();
        
        return ResponseEntity.ok(ApiResponse.success(response));
    }
    
    // DTOs
    
    @Data
    @lombok.Builder
    public static class AssetRegistrationResponse {
        private UUID assetId;
        private UUID versionId;
        private String contentHash;
        private java.time.Instant createdAt;
    }
    
    @Data
    @lombok.Builder
    public static class AssetResponse {
        private UUID id;
        private UUID escrowAccountId;
        private String assetType;
        private String visibility;
        private String declaredCreationType;
        private java.time.Instant createdAt;
        
        public static AssetResponse from(CreativeAsset asset) {
            return AssetResponse.builder()
                .id(asset.getId())
                .escrowAccountId(asset.getEscrowAccountId())
                .assetType(asset.getAssetType().name())
                .visibility(asset.getVisibility().name())
                .declaredCreationType(asset.getDeclaredCreationType().name())
                .createdAt(asset.getCreatedAt())
                .build();
        }
    }
    
    @Data
    @lombok.Builder
    public static class VersionResponse {
        private UUID id;
        private UUID assetId;
        private String contentHash;
        private String payloadMeta;
        private java.time.Instant createdAt;
        
        public static VersionResponse from(AssetVersion version) {
            return VersionResponse.builder()
                .id(version.getId())
                .assetId(version.getAssetId())
                .contentHash(version.getContentHash())
                .payloadMeta(version.getPayloadMeta())
                .createdAt(version.getCreatedAt())
                .build();
        }
    }
    
    @Data
    public static class ReferenceRequest {
        private UUID assetId;
        private String contextType;
        private UUID contextId;
        private String contextMeta;
    }
    
    @Data
    @lombok.Builder
    public static class ReferenceResponse {
        private UUID assetId;
        private String contextType;
        private UUID contextId;
    }
}
