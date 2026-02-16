package com.trustescrow.presentation.controller;

import com.trustescrow.application.dto.ApiResponse;
import com.trustescrow.application.service.LemonCheckoutService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * Payment Controller for Phase 10.
 * Handles payment-related operations.
 */
@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
@Slf4j
public class PaymentController {
    
    private final LemonCheckoutService checkoutService;
    
    /**
     * Generate Lemon checkout link for an invoice.
     * 
     * GET /api/payments/invoices/{invoiceId}/checkout
     */
    @GetMapping("/invoices/{invoiceId}/checkout")
    public ResponseEntity<ApiResponse<CheckoutLinkResponse>> generateCheckoutLink(
            @PathVariable UUID invoiceId) {
        
        log.info("Generating checkout link for invoice: {}", invoiceId);
        
        String checkoutUrl = checkoutService.generateCheckoutLink(invoiceId);
        
        CheckoutLinkResponse response = CheckoutLinkResponse.builder()
            .checkoutUrl(checkoutUrl)
            .invoiceId(invoiceId)
            .build();
        
        return ResponseEntity.ok(ApiResponse.success(response));
    }
    
    @lombok.Data
    @lombok.Builder
    public static class CheckoutLinkResponse {
        private UUID invoiceId;
        private String checkoutUrl;
    }
}
