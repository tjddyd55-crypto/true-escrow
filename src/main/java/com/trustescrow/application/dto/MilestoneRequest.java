package com.trustescrow.application.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class MilestoneRequest {
    
    @NotNull
    private String title;
    
    private String description;
    
    @NotNull
    @Positive
    private BigDecimal amount;
    
    @NotNull
    private Integer orderIndex; // 1, 2, or 3
}
