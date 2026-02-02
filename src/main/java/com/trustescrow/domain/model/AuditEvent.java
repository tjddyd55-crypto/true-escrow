package com.trustescrow.domain.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "audit_events", indexes = {
    @Index(name = "idx_audit_deal_created", columnList = "dealId,createdAt")
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class AuditEvent {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(nullable = false)
    private UUID dealId;
    
    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private AuditEventType type;
    
    @Column(nullable = false)
    private String actor; // userId or "system"
    
    @Column(columnDefinition = "TEXT")
    private String payload; // JSON
    
    @Column(nullable = false)
    private Instant createdAt;
    
    // Append-only: no update methods
}
