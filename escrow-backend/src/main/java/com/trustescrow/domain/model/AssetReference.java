package com.trustescrow.domain.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

/**
 * Asset Reference entity for Registry Extension.
 * 
 * Records when external services (auditions, projects, etc.) reference an asset.
 * This is recorded in registry_log as a REFERENCED event.
 * 
 * This entity is optional - references can be stored directly in registry_log.
 * Created for convenience and querying.
 */
@Entity
@Table(name = "asset_references", indexes = {
    @Index(name = "idx_refs_asset", columnList = "assetId"),
    @Index(name = "idx_refs_context", columnList = "contextType,contextId"),
    @Index(name = "idx_refs_created", columnList = "createdAt")
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class AssetReference {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(nullable = false, name = "asset_id")
    private UUID assetId;
    
    @Column(nullable = false, name = "context_type")
    @Enumerated(EnumType.STRING)
    private ContextType contextType;
    
    @Column(nullable = false, name = "context_id")
    private UUID contextId; // ID in the external context (audition, project, etc.)
    
    @Column(name = "context_meta", columnDefinition = "TEXT")
    private String contextMeta; // JSON: additional context metadata (optional)
    
    @Column(nullable = false, name = "created_at", updatable = false)
    private Instant createdAt;
    
    public enum ContextType {
        AUDITION,      // Referenced in an audition
        PROJECT,       // Referenced in a project
        EXTERNAL       // Referenced by external service
    }
    
    /**
     * Note: This entity is append-only.
     * References are never deleted or modified.
     */
}
