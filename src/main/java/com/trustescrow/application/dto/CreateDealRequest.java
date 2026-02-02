package com.trustescrow.application.dto;

import com.trustescrow.domain.model.DealCategory;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
public class CreateDealRequest {
    @NotNull
    private UUID buyerId;
    
    @NotNull
    private UUID sellerId;
    
    @NotNull
    private String itemRef;
    
    @NotNull
    private DealCategory category;
    
    @NotNull
    @Positive
    private BigDecimal totalAmount;
    
    @NotNull
    private String currency;
}
