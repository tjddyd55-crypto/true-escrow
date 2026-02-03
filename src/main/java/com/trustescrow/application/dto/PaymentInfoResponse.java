package com.trustescrow.application.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Data
public class PaymentInfoResponse {
    private UUID id;
    private UUID dealId;
    private UUID buyerId;
    private UUID sellerId;
    private BigDecimal totalAmount;
    private String currency;
    private String status;
    private String paymentMethod;
    private String paymentProvider;
    private Instant paidAt;
}
