package com.trustescrow.domain.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Work Rule - defines what work needs to be done in a block.
 */
@Entity
@Table(name = "work_rules", indexes = {
    @Index(name = "idx_work_rules_block", columnList = "blockId")
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class WorkRule {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(nullable = false)
    private UUID blockId;
    
    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private WorkType workType;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    @Column(nullable = false)
    private Integer quantity;
    
    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private Frequency frequency;
    
    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(columnDefinition = "integer[]")
    private List<Integer> dueDates; // Specific day numbers
    
    @Column(nullable = false)
    private Instant createdAt;
    
    @Column(nullable = false)
    private Instant updatedAt;
    
    public enum WorkType {
        BLOG,
        DOCUMENT,
        INSPECTION,
        CUSTOM
    }
    
    public enum Frequency {
        ONCE,
        DAILY,
        WEEKLY,
        CUSTOM
    }
}
