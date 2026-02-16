package com.trustescrow.application.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.UUID;

@Data
public class UpdatePaymentInfoRequest {
    
    private UUID buyerId;
    private UUID sellerId;
    
    @NotBlank
    private String paymentMethod;
    
    @NotBlank
    private String paymentProvider;
}
