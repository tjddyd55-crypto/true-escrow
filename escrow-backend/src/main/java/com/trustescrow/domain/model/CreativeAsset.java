package com.trustescrow.domain.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

/**
 * Creative Asset entity for Registry Extension.
 * 
 * CRITICAL: This is append-only. No UPDATE/DELETE allowed.
 * Changes are recorded as new versions, not modifications.
 * 
 * Position: Neutral record-keeping infrastructure only.
 * Does NOT provide copyright protection guarantees or legal validity.
 */
@Entity
@Table(name = "assets", indexes = {
    @Index(name = "idx_assets_account", columnList = "escrowAccountId"),
    @Index(name = "idx_assets_type", columnList = "assetType"),
    @Index(name = "idx_assets_created", columnList = "createdAt")
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class CreativeAsset {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(nullable = false, name = "escrow_account_id")
    private UUID escrowAccountId; // Identity: escrow account that registered this asset
    
    @Column(nullable = false, name = "asset_type")
    @Enumerated(EnumType.STRING)
    private AssetType assetType;
    
    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private Visibility visibility;
    
    @Column(nullable = false, name = "declared_creation_type")
    @Enumerated(EnumType.STRING)
    private DeclaredCreationType declaredCreationType;
    
    @Column(nullable = false, name = "created_at", updatable = false)
    private Instant createdAt;
    
    public enum AssetType {
        LYRIC,
        DEMO_AUDIO,
        COMPOSITION,
        VIDEO,
        IMAGE,
        DOCUMENT,
        OTHER
    }
    
    public enum Visibility {
        PUBLIC,           // Publicly accessible
        AUDITION_ONLY,    // Only accessible within audition context
        PRIVATE           // Private to account owner
    }
    
    public enum DeclaredCreationType {
        HUMAN,           // Declared as human-created
        AI_ASSISTED,     // Declared as AI-assisted
        AI_GENERATED     // Declared as AI-generated
    }
    
    /**
     * Note: Visibility changes are NOT allowed via UPDATE.
     * They must be recorded as new events in registry_log.
     * This entity itself is immutable after creation.
     */
}
