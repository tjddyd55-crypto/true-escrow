package com.trustescrow.application.dto;

import com.trustescrow.domain.model.Deal;
import com.trustescrow.domain.model.DealState;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
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
    private List<MilestoneInfo> milestones;
    
    /**
     * STEP 3: Milestone information with payment details.
     */
    @Data
    @Builder
    public static class MilestoneInfo {
        private String id;
        private String status; // "PENDING" | "PAID_HELD" | "RELEASED" | "REFUNDED"
        private BigDecimal amount; // STEP 3: Milestone amount
        private String currency; // STEP 3: Currency
        private String orderId; // STEP 3: Lemon Squeezy order ID
        private Instant paidAt; // STEP 3: Payment timestamp
        
        public MilestoneInfo(String id, String status) {
            this.id = id;
            this.status = status;
        }
        
        public MilestoneInfo(String id, String status, BigDecimal amount, String currency, String orderId, Instant paidAt) {
            this.id = id;
            this.status = status;
            this.amount = amount;
            this.currency = currency;
            this.orderId = orderId;
            this.paidAt = paidAt;
        }
    }
    
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
