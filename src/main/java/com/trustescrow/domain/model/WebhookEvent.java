package com.trustescrow.domain.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/**
 * Webhook event storage for idempotency.
 * Prevents duplicate processing of webhook events.
 */
@Entity
@Table(name = "webhook_events", indexes = {
    @Index(name = "idx_webhook_events_provider_event_id", columnList = "provider,eventId", unique = true),
    @Index(name = "idx_webhook_events_processed", columnList = "processedAt")
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class WebhookEvent {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(nullable = false, length = 50)
    private String provider; // 'LEMON', 'STRIPE', etc.
    
    @Column(nullable = false, length = 255)
    private String eventId; // Unique event ID from provider
    
    @Column(nullable = false, length = 100)
    private String eventName; // e.g., 'order_created', 'order_updated'
    
    @Column(columnDefinition = "jsonb")
    @JdbcTypeCode(SqlTypes.JSON)
    private Map<String, Object> payload; // Full webhook payload
    
    @Column
    private Instant processedAt; // When event was processed (null if not processed)
    
    @Column(nullable = false)
    private Instant createdAt;
    
    public void markAsProcessed() {
        this.processedAt = Instant.now();
    }
    
    public boolean isProcessed() {
        return processedAt != null;
    }
}
