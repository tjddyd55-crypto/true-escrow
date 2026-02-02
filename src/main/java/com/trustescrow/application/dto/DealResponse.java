package com.trustescrow.application.dto;

import com.trustescrow.domain.model.Deal;
import com.trustescrow.domain.model.DealState;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class DealResponse {
    private UUID id;
    private UUID buyerId;
    private UUID sellerId;
    private String itemRef;
    private String category;
    private BigDecimal totalAmount;
    private BigDecimal immediateAmount;
    private BigDecimal holdbackAmount;
    private String currency;
    private DealState state;
    private UUID contractInstanceId;
    private Instant createdAt;
    private Instant updatedAt;
    
    public static DealResponse from(Deal deal) {
        return DealResponse.builder()
            .id(deal.getId())
            .buyerId(deal.getBuyerId())
            .sellerId(deal.getSellerId())
            .itemRef(deal.getItemRef())
            .category(deal.getCategory().name())
            .totalAmount(deal.getTotalAmount())
            .immediateAmount(deal.getImmediateAmount())
            .holdbackAmount(deal.getHoldbackAmount())
            .currency(deal.getCurrency())
            .state(deal.getState())
            .contractInstanceId(deal.getContractInstanceId())
            .createdAt(deal.getCreatedAt())
            .updatedAt(deal.getUpdatedAt())
            .build();
    }
}
