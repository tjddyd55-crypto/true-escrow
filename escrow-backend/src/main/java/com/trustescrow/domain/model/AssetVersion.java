package com.trustescrow.domain.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

/**
 * Asset Version entity for Registry Extension.
 * 
 * CRITICAL: This is append-only. Each version is immutable.
 * New versions are created, never updated.
 * 
 * Contains SHA-256 hash of the asset content.
 */
@Entity
@Table(name = "asset_versions", indexes = {
    @Index(name = "idx_versions_asset", columnList = "assetId"),
    @Index(name = "idx_versions_hash", columnList = "contentHash"),
    @Index(name = "idx_versions_created", columnList = "createdAt")
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class AssetVersion {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(nullable = false, name = "asset_id")
    private UUID assetId;
    
    @Column(nullable = false, name = "content_hash", length = 64)
    private String contentHash; // SHA-256 hash (hex, 64 chars)
    
    @Column(name = "payload_meta", columnDefinition = "TEXT")
    private String payloadMeta; // JSON: size, mime, checksum_meta (optional)
    
    @Column(nullable = false, name = "created_at", updatable = false)
    private Instant createdAt;
    
    /**
     * Note: This entity is immutable after creation.
     * No UPDATE/DELETE operations allowed.
     */
}
