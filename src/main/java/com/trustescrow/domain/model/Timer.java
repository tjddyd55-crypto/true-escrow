package com.trustescrow.domain.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.Duration;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "timers")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class Timer {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(nullable = false)
    private UUID dealId;
    
    @Column(nullable = false)
    private String timerType; // AUTO_APPROVE, DISPUTE_TTL, HOLDBACK_RELEASE
    
    @Column(nullable = false)
    private Instant startedAt;
    
    @Column(nullable = false)
    private Duration duration;
    
    private Instant firedAt;
    
    @Column(nullable = false)
    private Boolean active;
    
    public boolean isElapsed() {
        return active && Instant.now().isAfter(startedAt.plus(duration));
    }
    
    public Instant getExpiresAt() {
        return startedAt.plus(duration);
    }
    
    public void markFired() {
        this.firedAt = Instant.now();
        this.active = false;
    }
}
