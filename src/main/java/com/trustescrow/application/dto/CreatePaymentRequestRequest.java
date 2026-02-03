package com.trustescrow.application.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class CreatePaymentRequestRequest {
    
    @NotNull
    private String itemName; // 매물명
    
    @NotNull
    @Positive
    private BigDecimal amount;
    
    @NotNull
    private String currency;
    
    @NotNull
    private String paymentType; // "FULL" or "MILESTONE"
    
    private List<MilestoneRequest> milestones; // 마일스톤 선택 시
}
