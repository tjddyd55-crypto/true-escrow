package com.trustescrow.domain.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/**
 * Activity log for transaction tracking.
 */
@Entity
@Table(name = "activity_logs", indexes = {
    @Index(name = "idx_activity_logs_transaction", columnList = "transactionId,createdAt")
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class ActivityLog {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(nullable = false)
    private UUID transactionId;
    
    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private ActorRole actorRole;
    
    @Column(nullable = false)
    private String action;
    
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private Map<String, Object> meta;
    
    @Column(nullable = false)
    private Instant createdAt;
    
    public enum ActorRole {
        BUYER,
        SELLER,
        ADMIN
    }
}
