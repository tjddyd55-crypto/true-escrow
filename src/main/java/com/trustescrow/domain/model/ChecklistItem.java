package com.trustescrow.domain.model;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "checklist_items")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class ChecklistItem {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(nullable = false)
    private UUID milestoneId;
    
    @Column(nullable = false)
    private String itemId; // from template
    
    @Column(nullable = false)
    private String description;
    
    @Column(nullable = false)
    private Boolean evidenceRequired;
    
    @Enumerated(EnumType.STRING)
    private ChecklistItemStatus status;
    
    @Column(nullable = false)
    private Integer orderIndex;
}
