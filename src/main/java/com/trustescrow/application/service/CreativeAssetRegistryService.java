package com.trustescrow.application.service;

import com.trustescrow.domain.model.*;
import com.trustescrow.domain.service.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Creative Asset Registry Service for Registry Extension.
 * 
 * CRITICAL: This service enforces append-only policy.
 * - No UPDATE operations on assets or versions
 * - All changes are recorded as new versions or events
 * - Visibility changes are recorded as events, not updates
 * 
 * Position: Neutral record-keeping infrastructure only.
 * Does NOT provide copyright protection guarantees or legal validity.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CreativeAssetRegistryService {
    
    private final CreativeAssetRepository assetRepository;
    private final AssetVersionRepository versionRepository;
    private final RegistryLogRepository registryLogRepository;
    private final AssetReferenceRepository referenceRepository;
    private final HashService hashService;
    
    /**
     * Register a new creative asset.
     * Creates asset, first version, and registry log entry.
     * 
     * @param escrowAccountId Account that owns this asset
     * @param assetType Type of asset
     * @param visibility Visibility setting
     * @param declaredCreationType Declared creation type
     * @param content Asset content (bytes) - will be hashed
     * @param payloadMeta Optional metadata (JSON string)
     * @return Created asset with first version
     */
    @Transactional
    public AssetRegistrationResult registerAsset(
            UUID escrowAccountId,
            CreativeAsset.AssetType assetType,
            CreativeAsset.Visibility visibility,
            CreativeAsset.DeclaredCreationType declaredCreationType,
            byte[] content,
            String payloadMeta) {
        
        log.info("Registering asset for account: {}, type: {}", escrowAccountId, assetType);
        
        // Generate content hash
        String contentHash = hashService.generateHash(content);
        
        // Check if this exact content already exists (idempotency check)
        // Note: Same content hash can exist for different assets (different owners)
        // We allow this - it's just a hash collision, not an error
        
        // Create asset
        CreativeAsset asset = CreativeAsset.builder()
            .escrowAccountId(escrowAccountId)
            .assetType(assetType)
            .visibility(visibility)
            .declaredCreationType(declaredCreationType)
            .createdAt(Instant.now())
            .build();
        
        asset = assetRepository.save(asset);
        log.info("Asset created: {}", asset.getId());
        
        // Create first version
        AssetVersion version = AssetVersion.builder()
            .assetId(asset.getId())
            .contentHash(contentHash)
            .payloadMeta(payloadMeta)
            .createdAt(Instant.now())
            .build();
        
        version = versionRepository.save(version);
        log.info("First version created: {}", version.getId());
        
        // Record in registry log
        recordRegistryEvent(
            escrowAccountId,
            asset.getId(),
            RegistryLog.EventType.ASSET_REGISTERED,
            createEventPayload("asset_id", asset.getId().toString(), "version_id", version.getId().toString())
        );
        
        // Record version addition
        recordRegistryEvent(
            escrowAccountId,
            asset.getId(),
            RegistryLog.EventType.VERSION_ADDED,
            createEventPayload("version_id", version.getId().toString(), "content_hash", contentHash)
        );
        
        return AssetRegistrationResult.builder()
            .assetId(asset.getId())
            .versionId(version.getId())
            .contentHash(contentHash)
            .createdAt(asset.getCreatedAt())
            .build();
    }
    
    /**
     * Add a new version to an existing asset.
     * CRITICAL: This does NOT update the asset. It creates a new version.
     * 
     * @param assetId Asset ID
     * @param content New content (bytes) - will be hashed
     * @param payloadMeta Optional metadata (JSON string)
     * @return Created version
     */
    @Transactional
    public AssetVersion addVersion(UUID assetId, byte[] content, String payloadMeta) {
        log.info("Adding version to asset: {}", assetId);
        
        // Load asset
        CreativeAsset asset = assetRepository.findById(assetId)
            .orElseThrow(() -> new IllegalArgumentException("Asset not found: " + assetId));
        
        // Generate content hash
        String contentHash = hashService.generateHash(content);
        
        // Check if this exact version already exists (idempotency)
        // Note: Same content hash can exist multiple times for same asset
        // This is allowed - it's just a duplicate submission
        
        // Create new version
        AssetVersion version = AssetVersion.builder()
            .assetId(asset.getId())
            .contentHash(contentHash)
            .payloadMeta(payloadMeta)
            .createdAt(Instant.now())
            .build();
        
        version = versionRepository.save(version);
        log.info("Version created: {}", version.getId());
        
        // Record in registry log
        recordRegistryEvent(
            asset.getEscrowAccountId(),
            asset.getId(),
            RegistryLog.EventType.VERSION_ADDED,
            createEventPayload("version_id", version.getId().toString(), "content_hash", contentHash)
        );
        
        return version;
    }
    
    /**
     * Record a visibility change event.
     * CRITICAL: This does NOT update the asset visibility.
     * It only records the change as an event in registry_log.
     * 
     * Note: For Phase 9 MVP, we record the event but don't change the asset.
     * In a full implementation, you might want to track "current visibility" separately
     * or use a separate visibility_history table.
     * 
     * @param assetId Asset ID
     * @param newVisibility New visibility setting
     */
    @Transactional
    public void recordVisibilityChange(UUID assetId, CreativeAsset.Visibility newVisibility) {
        log.info("Recording visibility change for asset: {} to {}", assetId, newVisibility);
        
        // Load asset
        CreativeAsset asset = assetRepository.findById(assetId)
            .orElseThrow(() -> new IllegalArgumentException("Asset not found: " + assetId));
        
        // Record event (NOT an update to the asset)
        recordRegistryEvent(
            asset.getEscrowAccountId(),
            asset.getId(),
            RegistryLog.EventType.VISIBILITY_CHANGED,
            createEventPayload("new_visibility", newVisibility.name())
        );
        
        // Note: The asset.visibility field itself is NOT updated.
        // This enforces append-only policy.
        // If you need current visibility, query registry_log for the latest VISIBILITY_CHANGED event.
    }
    
    /**
     * Record a reference to an asset by an external service.
     * 
     * @param assetId Asset ID
     * @param contextType Context type (audition, project, external)
     * @param contextId Context ID
     * @param contextMeta Optional context metadata (JSON string)
     */
    @Transactional
    public void recordReference(
            UUID assetId,
            AssetReference.ContextType contextType,
            UUID contextId,
            String contextMeta) {
        
        log.info("Recording reference for asset: {} in context: {}:{}", assetId, contextType, contextId);
        
        // Load asset
        CreativeAsset asset = assetRepository.findById(assetId)
            .orElseThrow(() -> new IllegalArgumentException("Asset not found: " + assetId));
        
        // Create reference record
        AssetReference reference = AssetReference.builder()
            .assetId(asset.getId())
            .contextType(contextType)
            .contextId(contextId)
            .contextMeta(contextMeta)
            .createdAt(Instant.now())
            .build();
        
        reference = referenceRepository.save(reference);
        
        // Record in registry log
        recordRegistryEvent(
            asset.getEscrowAccountId(),
            asset.getId(),
            RegistryLog.EventType.REFERENCED,
            createEventPayload("context_type", contextType.name(), "context_id", contextId.toString())
        );
        
        log.info("Reference recorded: {}", reference.getId());
    }
    
    /**
     * Get asset by ID.
     */
    public CreativeAsset getAsset(UUID assetId) {
        return assetRepository.findById(assetId)
            .orElseThrow(() -> new IllegalArgumentException("Asset not found: " + assetId));
    }
    
    /**
     * Get all versions for an asset.
     */
    public List<AssetVersion> getAssetVersions(UUID assetId) {
        return versionRepository.findByAssetIdOrderByCreatedAtDesc(assetId);
    }
    
    /**
     * Get registry log entries for an asset.
     */
    public List<RegistryLog> getAssetRegistryLog(UUID assetId) {
        return registryLogRepository.findByAssetIdOrderByCreatedAtDesc(assetId);
    }
    
    /**
     * Get references for an asset.
     */
    public List<AssetReference> getAssetReferences(UUID assetId) {
        return referenceRepository.findByAssetIdOrderByCreatedAtDesc(assetId);
    }
    
    /**
     * Record an event in registry log.
     */
    private void recordRegistryEvent(
            UUID escrowAccountId,
            UUID assetId,
            RegistryLog.EventType eventType,
            String eventPayload) {
        
        // Generate event hash
        String eventHash = hashService.generateHash(eventPayload);
        
        RegistryLog logEntry = RegistryLog.builder()
            .escrowAccountId(escrowAccountId)
            .assetId(assetId)
            .eventType(eventType)
            .eventHash(eventHash)
            .eventPayload(eventPayload)
            .createdAt(Instant.now())
            .build();
        
        registryLogRepository.save(logEntry);
    }
    
    /**
     * Create simple JSON-like event payload string.
     * For Phase 9 MVP, using simple string format.
     * In production, use proper JSON library.
     */
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
    
    /**
     * Result class for asset registration.
     */
    @lombok.Data
    @lombok.Builder
    public static class AssetRegistrationResult {
        private UUID assetId;
        private UUID versionId;
        private String contentHash;
        private Instant createdAt;
    }
}
