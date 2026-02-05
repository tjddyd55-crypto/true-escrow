package com.trustescrow.domain.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

/**
 * Work Item - auto-generated from WorkRule when block is activated.
 */
@Entity
@Table(name = "work_items", indexes = {
    @Index(name = "idx_work_items_work_rule", columnList = "workRuleId"),
    @Index(name = "idx_work_items_status", columnList = "status")
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class WorkItem {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(nullable = false)
    private UUID workRuleId;
    
    @Column(nullable = false)
    private Integer dueDate; // Day number
    
    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private WorkItemStatus status;
    
    private Instant submittedAt;
    
    @Column(nullable = false)
    private Instant createdAt;
    
    @Column(nullable = false)
    private Instant updatedAt;
    
    public enum WorkItemStatus {
        PENDING,
        SUBMITTED,
        APPROVED
    }
    
    public void submit() {
        this.status = WorkItemStatus.SUBMITTED;
        this.submittedAt = Instant.now();
        this.updatedAt = Instant.now();
    }
    
    public void approve() {
        this.status = WorkItemStatus.APPROVED;
        this.updatedAt = Instant.now();
    }
}
