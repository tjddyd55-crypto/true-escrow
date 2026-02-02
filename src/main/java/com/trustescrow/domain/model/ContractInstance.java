package com.trustescrow.domain.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "contract_instances")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class ContractInstance {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(nullable = false)
    private UUID dealId;
    
    @Column(nullable = false)
    private UUID templateId;
    
    @Column(nullable = false)
    private Integer templateVersion;
    
    @Column(nullable = false, columnDefinition = "TEXT")
    private String snapshotJson;
    
    @Column(nullable = false)
    private Instant createdAt;
    
    // Immutable: no update methods allowed
}
