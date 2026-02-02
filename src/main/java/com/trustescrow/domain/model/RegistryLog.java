package com.trustescrow.domain.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

/**
 * Registry Log entity for Registry Extension.
 * 
 * CRITICAL: This is append-only audit/event log.
 * Records all events related to assets (registration, version addition, 
 * visibility changes, evidence exports, references, etc.).
 * 
 * Used for audit trail and potential blockchain anchoring.
 */
@Entity
@Table(name = "registry_log", indexes = {
    @Index(name = "idx_registry_account", columnList = "escrowAccountId"),
    @Index(name = "idx_registry_asset", columnList = "assetId"),
    @Index(name = "idx_registry_event_type", columnList = "eventType"),
    @Index(name = "idx_registry_created", columnList = "createdAt")
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class RegistryLog {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(nullable = false, name = "escrow_account_id")
    private UUID escrowAccountId;
    
    @Column(name = "asset_id")
    private UUID assetId; // Nullable for non-asset events
    
    @Column(nullable = false, name = "event_type")
    @Enumerated(EnumType.STRING)
    private EventType eventType;
    
    @Column(name = "event_hash", length = 64)
    private String eventHash; // SHA-256 hash of event payload (hex, 64 chars)
    
    @Column(name = "event_payload", columnDefinition = "TEXT")
    private String eventPayload; // JSON payload (optional, for detailed event data)
    
    @Column(nullable = false, name = "created_at", updatable = false)
    private Instant createdAt;
    
    public enum EventType {
        ASSET_REGISTERED,      // Asset was registered
        VERSION_ADDED,         // New version added to asset
        VISIBILITY_CHANGED,    // Visibility policy changed (recorded as event, not UPDATE)
        EVIDENCE_EXPORTED,     // Evidence package was exported
        REFERENCED,            // Asset was referenced by external service
        ANCHORED               // Asset/version was anchored to blockchain
    }
    
    /**
     * Note: This entity is append-only.
     * No UPDATE/DELETE operations allowed.
     * Used for audit trail and blockchain anchoring.
     */
}
