package com.trustescrow.domain.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

/**
 * File uploaded for a milestone.
 */
@Entity
@Table(name = "milestone_files", indexes = {
    @Index(name = "idx_milestone_files_milestone", columnList = "milestoneId")
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class MilestoneFile {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(nullable = false)
    private UUID milestoneId;
    
    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private UploaderRole uploaderRole;
    
    @Column(nullable = false)
    private String fileUrl;
    
    private String fileName;
    
    private Long fileSize;
    
    private String mimeType;
    
    @Column(nullable = false)
    private Instant createdAt;
    
    public enum UploaderRole {
        BUYER,
        SELLER
    }
}
