package com.trustescrow.application.service;

import com.trustescrow.domain.model.*;
import com.trustescrow.domain.service.*;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Evidence Export Service for Registry Extension.
 * 
 * Generates evidence packages (PDF/JSON) for assets.
 * 
 * Position: Provides evidence that "this asset existed at this time in this form."
 * Does NOT guarantee copyright protection or legal validity.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EvidenceExportService {
    
    private final CreativeAssetRepository assetRepository;
    private final AssetVersionRepository versionRepository;
    private final RegistryLogRepository registryLogRepository;
    private final HashService hashService;
    
    /**
     * Generate evidence package for an asset.
     * 
     * @param assetId Asset ID
     * @return Evidence package data
     */
    @Transactional(readOnly = true)
    public EvidencePackage generateEvidence(UUID assetId) {
        log.info("Generating evidence package for asset: {}", assetId);
        
        // Load asset
        CreativeAsset asset = assetRepository.findById(assetId)
            .orElseThrow(() -> new IllegalArgumentException("Asset not found: " + assetId));
        
        // Load all versions
        List<AssetVersion> versions = versionRepository.findByAssetIdOrderByCreatedAtDesc(assetId);
        
        // Load registry log entries
        List<RegistryLog> logEntries = registryLogRepository.findByAssetIdOrderByCreatedAtDesc(assetId);
        
        // Build evidence package
        EvidencePackage evidence = EvidencePackage.builder()
            .assetId(asset.getId())
            .escrowAccountId(asset.getEscrowAccountId())
            .assetType(asset.getAssetType().name())
            .visibility(asset.getVisibility().name())
            .declaredCreationType(asset.getDeclaredCreationType().name())
            .registeredAt(asset.getCreatedAt())
            .versions(versions.stream()
                .map(v -> VersionSummary.builder()
                    .versionId(v.getId())
                    .contentHash(v.getContentHash())
                    .payloadMeta(v.getPayloadMeta())
                    .createdAt(v.getCreatedAt())
                    .build())
                .collect(Collectors.toList()))
            .registryLogSummary(logEntries.stream()
                .map(e -> LogEntrySummary.builder()
                    .eventType(e.getEventType().name())
                    .eventHash(e.getEventHash())
                    .createdAt(e.getCreatedAt())
                    .build())
                .collect(Collectors.toList()))
            .generatedAt(Instant.now())
            .build();
        
        // Record evidence export event
        String eventPayload = createEventPayload("evidence_generated_at", Instant.now().toString());
        String eventHash = hashService.generateHash(eventPayload);
        
        RegistryLog logEntry = RegistryLog.builder()
            .escrowAccountId(asset.getEscrowAccountId())
            .assetId(asset.getId())
            .eventType(RegistryLog.EventType.EVIDENCE_EXPORTED)
            .eventHash(eventHash)
            .eventPayload(eventPayload)
            .createdAt(Instant.now())
            .build();
        
        registryLogRepository.save(logEntry);
        
        log.info("Evidence package generated for asset: {}", assetId);
        return evidence;
    }
    
    /**
     * Generate JSON representation of evidence package.
     */
    public String generateJson(EvidencePackage evidence) {
        // Simple JSON generation for Phase 9 MVP
        // In production, use proper JSON library (Jackson, Gson, etc.)
        StringBuilder json = new StringBuilder("{");
        json.append("\"asset_id\":\"").append(evidence.getAssetId()).append("\",");
        json.append("\"escrow_account_id\":\"").append(evidence.getEscrowAccountId()).append("\",");
        json.append("\"asset_type\":\"").append(evidence.getAssetType()).append("\",");
        json.append("\"visibility\":\"").append(evidence.getVisibility()).append("\",");
        json.append("\"declared_creation_type\":\"").append(evidence.getDeclaredCreationType()).append("\",");
        json.append("\"registered_at\":\"").append(evidence.getRegisteredAt()).append("\",");
        json.append("\"generated_at\":\"").append(evidence.getGeneratedAt()).append("\",");
        json.append("\"versions\":[");
        for (int i = 0; i < evidence.getVersions().size(); i++) {
            if (i > 0) json.append(",");
            VersionSummary v = evidence.getVersions().get(i);
            json.append("{");
            json.append("\"version_id\":\"").append(v.getVersionId()).append("\",");
            json.append("\"content_hash\":\"").append(v.getContentHash()).append("\",");
            json.append("\"payload_meta\":").append(v.getPayloadMeta() != null ? "\"" + v.getPayloadMeta() + "\"" : "null").append(",");
            json.append("\"created_at\":\"").append(v.getCreatedAt()).append("\"");
            json.append("}");
        }
        json.append("],");
        json.append("\"registry_log_summary\":[");
        for (int i = 0; i < evidence.getRegistryLogSummary().size(); i++) {
            if (i > 0) json.append(",");
            LogEntrySummary e = evidence.getRegistryLogSummary().get(i);
            json.append("{");
            json.append("\"event_type\":\"").append(e.getEventType()).append("\",");
            json.append("\"event_hash\":\"").append(e.getEventHash()).append("\",");
            json.append("\"created_at\":\"").append(e.getCreatedAt()).append("\"");
            json.append("}");
        }
        json.append("]");
        json.append("}");
        return json.toString();
    }
    
    /**
     * Generate PDF representation of evidence package.
     * 
     * For Phase 9 MVP, returns a simple text representation.
     * In production, use a PDF library (iText, Apache PDFBox, etc.).
     */
    public String generatePdf(EvidencePackage evidence) {
        // Simple text representation for Phase 9 MVP
        // In production, generate actual PDF
        StringBuilder pdf = new StringBuilder();
        pdf.append("CREATIVE ASSET REGISTRY - EVIDENCE PACKAGE\n");
        pdf.append("==========================================\n\n");
        pdf.append("Asset ID: ").append(evidence.getAssetId()).append("\n");
        pdf.append("Escrow Account ID: ").append(evidence.getEscrowAccountId()).append("\n");
        pdf.append("Asset Type: ").append(evidence.getAssetType()).append("\n");
        pdf.append("Visibility: ").append(evidence.getVisibility()).append("\n");
        pdf.append("Declared Creation Type: ").append(evidence.getDeclaredCreationType()).append("\n");
        pdf.append("Registered At: ").append(evidence.getRegisteredAt()).append("\n");
        pdf.append("Generated At: ").append(evidence.getGeneratedAt()).append("\n\n");
        pdf.append("VERSIONS:\n");
        pdf.append("---------\n");
        for (VersionSummary v : evidence.getVersions()) {
            pdf.append("Version ID: ").append(v.getVersionId()).append("\n");
            pdf.append("Content Hash: ").append(v.getContentHash()).append("\n");
            pdf.append("Created At: ").append(v.getCreatedAt()).append("\n\n");
        }
        pdf.append("REGISTRY LOG SUMMARY:\n");
        pdf.append("--------------------\n");
        for (LogEntrySummary e : evidence.getRegistryLogSummary()) {
            pdf.append("Event Type: ").append(e.getEventType()).append("\n");
            pdf.append("Event Hash: ").append(e.getEventHash()).append("\n");
            pdf.append("Created At: ").append(e.getCreatedAt()).append("\n\n");
        }
        pdf.append("\nNOTE: This evidence package provides a record that this asset\n");
        pdf.append("existed at the specified time in the specified form. It does NOT\n");
        pdf.append("guarantee copyright protection or legal validity.\n");
        return pdf.toString();
    }
    
    private String createEventPayload(String... keyValuePairs) {
        if (keyValuePairs.length % 2 != 0) {
            throw new IllegalArgumentException("Key-value pairs must be even");
        }
        StringBuilder payload = new StringBuilder("{");
        for (int i = 0; i < keyValuePairs.length; i += 2) {
            if (i > 0) payload.append(",");
            payload.append("\"").append(keyValuePairs[i]).append("\":\"")
                   .append(keyValuePairs[i + 1]).append("\"");
        }
        payload.append("}");
        return payload.toString();
    }
    
    @Data
    @Builder
    public static class EvidencePackage {
        private UUID assetId;
        private UUID escrowAccountId;
        private String assetType;
        private String visibility;
        private String declaredCreationType;
        private Instant registeredAt;
        private List<VersionSummary> versions;
        private List<LogEntrySummary> registryLogSummary;
        private Instant generatedAt;
    }
    
    @Data
    @Builder
    public static class VersionSummary {
        private UUID versionId;
        private String contentHash;
        private String payloadMeta;
        private Instant createdAt;
    }
    
    @Data
    @Builder
    public static class LogEntrySummary {
        private String eventType;
        private String eventHash;
        private Instant createdAt;
    }
}
