package com.trustescrow.domain.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "evidence_metadata")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class EvidenceMetadata {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(nullable = false)
    private UUID dealId;
    
    @Column(nullable = false)
    private UUID milestoneId; // MASTER TASK: Evidence is milestone-specific
    
    @Column(nullable = false)
    private UUID uploadedBy;
    
    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private EvidenceType type;
    
    @Column(nullable = false)
    private String uri; // storage pointer
    
    private String checksum; // future: for integrity
    
    @Column(nullable = false)
    private Instant createdAt;
}
