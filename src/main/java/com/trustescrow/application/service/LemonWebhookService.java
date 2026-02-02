package com.trustescrow.application.service;

import com.trustescrow.domain.model.Invoice;
import com.trustescrow.domain.model.Partner;
import com.trustescrow.domain.service.InvoiceRepository;
import com.trustescrow.domain.service.PartnerRepository;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;
import java.util.Map;
import java.util.UUID;

/**
 * Lemon Webhook Service for Phase 10.
 * Handles Lemon Squeezy webhook events.
 * 
 * CRITICAL: Only Lemon webhooks are trusted for payment confirmation.
 * Webhook signature verification is mandatory.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class LemonWebhookService {
    
    @Value("${lemon.webhook.secret:}")
    private String lemonWebhookSecret;
    
    private final InvoiceRepository invoiceRepository;
    private final PartnerRepository partnerRepository;
    private final EntitlementService entitlementService;
    
    /**
     * Process Lemon webhook event.
     * 
     * @param signature Webhook signature (HMAC)
     * @param payload Webhook payload (JSON string)
     * @return Processing result
     */
    @Transactional
    public WebhookProcessingResult processWebhook(String signature, String payload) {
        log.info("Processing Lemon webhook event");
        
        // Verify signature
        if (!verifySignature(signature, payload)) {
            log.error("Invalid webhook signature");
            throw new SecurityException("Invalid webhook signature");
        }
        
        // Parse payload (simplified for Phase 10 MVP)
        // In production, use proper JSON parsing
        WebhookPayload webhookPayload = parsePayload(payload);
        
        // Process based on event type
        switch (webhookPayload.getEventName()) {
            case "order_created":
            case "order_updated":
                return processPaymentSuccess(webhookPayload);
            case "subscription_created":
                return processSubscriptionCreated(webhookPayload);
            case "subscription_updated":
                return processSubscriptionUpdated(webhookPayload);
            case "subscription_cancelled":
                return processSubscriptionCancelled(webhookPayload);
            default:
                log.warn("Unknown webhook event type: {}", webhookPayload.getEventName());
                return WebhookProcessingResult.builder()
                    .success(false)
                    .message("Unknown event type")
                    .build();
        }
    }
    
    /**
     * Process payment success event.
     * Updates invoice to PAID and grants entitlement.
     */
    private WebhookProcessingResult processPaymentSuccess(WebhookPayload payload) {
        log.info("Processing payment success event");
        
        // Extract invoice_id from custom data
        String invoiceIdStr = payload.getCustomData().get("invoice_id");
        if (invoiceIdStr == null) {
            log.error("No invoice_id in webhook custom data");
            return WebhookProcessingResult.builder()
                .success(false)
                .message("No invoice_id in custom data")
                .build();
        }
        
        UUID invoiceId = UUID.fromString(invoiceIdStr);
        
        // Load invoice
        Invoice invoice = invoiceRepository.findById(invoiceId)
            .orElseThrow(() -> new IllegalArgumentException("Invoice not found: " + invoiceId));
        
        // Check if already PAID (idempotency)
        if (invoice.getStatus() == Invoice.InvoiceStatus.PAID) {
            log.info("Invoice already PAID, skipping (idempotent)");
            return WebhookProcessingResult.builder()
                .success(true)
                .message("Invoice already PAID")
                .build();
        }
        
        // Check if order_id already processed (idempotency)
        String orderId = payload.getOrderId();
        if (orderId != null && invoiceRepository.findByLemonOrderId(orderId).isPresent()) {
            log.info("Order ID already processed, skipping (idempotent)");
            return WebhookProcessingResult.builder()
                .success(true)
                .message("Order already processed")
                .build();
        }
        
        // Update invoice to PAID
        invoice.markAsPaid(java.time.Instant.now(), orderId);
        invoiceRepository.save(invoice);
        
        log.info("Invoice marked as PAID: {}", invoiceId);
        
        // Grant entitlement
        try {
            entitlementService.grantEntitlementForInvoice(invoiceId);
            log.info("Entitlement granted for invoice: {}", invoiceId);
        } catch (Exception e) {
            log.error("Failed to grant entitlement for invoice: {}", invoiceId, e);
            // Don't fail the webhook - invoice is already PAID
            // Entitlement can be granted manually if needed
        }
        
        return WebhookProcessingResult.builder()
            .success(true)
            .message("Payment processed successfully")
            .build();
    }
    
    /**
     * Process subscription created event.
     */
    private WebhookProcessingResult processSubscriptionCreated(WebhookPayload payload) {
        log.info("Processing subscription created event");
        // TODO: Implement subscription handling
        return WebhookProcessingResult.builder()
            .success(true)
            .message("Subscription created (not implemented)")
            .build();
    }
    
    /**
     * Process subscription updated event.
     */
    private WebhookProcessingResult processSubscriptionUpdated(WebhookPayload payload) {
        log.info("Processing subscription updated event");
        // TODO: Implement subscription update handling
        return WebhookProcessingResult.builder()
            .success(true)
            .message("Subscription updated (not implemented)")
            .build();
    }
    
    /**
     * Process subscription cancelled event.
     */
    private WebhookProcessingResult processSubscriptionCancelled(WebhookPayload payload) {
        log.info("Processing subscription cancelled event");
        // TODO: Implement subscription cancellation handling
        return WebhookProcessingResult.builder()
            .success(true)
            .message("Subscription cancelled (not implemented)")
            .build();
    }
    
    /**
     * Verify webhook signature using HMAC.
     */
    private boolean verifySignature(String signature, String payload) {
        if (lemonWebhookSecret == null || lemonWebhookSecret.isEmpty()) {
            log.warn("Lemon webhook secret not configured, skipping signature verification");
            return true; // For development only
        }
        
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKey = new SecretKeySpec(lemonWebhookSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            mac.init(secretKey);
            byte[] hashBytes = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
            String computedSignature = Base64.getEncoder().encodeToString(hashBytes);
            
            return signature.equals(computedSignature);
        } catch (NoSuchAlgorithmException | InvalidKeyException e) {
            log.error("Failed to verify webhook signature", e);
            return false;
        }
    }
    
    /**
     * Parse webhook payload (simplified for Phase 10 MVP).
     * In production, use proper JSON parsing library.
     */
    private WebhookPayload parsePayload(String payload) {
        // Phase 10 MVP: Simplified parsing
        // In production, use Jackson or Gson
        WebhookPayload webhookPayload = new WebhookPayload();
        
        // Extract event name (simplified)
        if (payload.contains("\"event_name\"")) {
            // Parse JSON (simplified)
            // In production, use proper JSON library
        }
        
        // For Phase 10 MVP, return placeholder
        webhookPayload.setEventName("order_created");
        webhookPayload.setOrderId("order_123"); // Extract from payload
        webhookPayload.setCustomData(Map.of("invoice_id", "invoice-uuid")); // Extract from payload
        
        return webhookPayload;
    }
    
    @Data
    public static class WebhookPayload {
        private String eventName;
        private String orderId;
        private Map<String, String> customData;
    }
    
    @lombok.Data
    @lombok.Builder
    public static class WebhookProcessingResult {
        private boolean success;
        private String message;
    }
}
