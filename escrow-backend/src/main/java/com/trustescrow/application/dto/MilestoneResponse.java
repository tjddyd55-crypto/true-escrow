package com.trustescrow.application.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Data
public class MilestoneResponse {
    private UUID id;
    private UUID dealId;
    private Integer orderIndex;
    private String title;
    private String description;
    private BigDecimal amount;
    private String status;
    private Instant createdAt;
    private Instant completedAt;
}
