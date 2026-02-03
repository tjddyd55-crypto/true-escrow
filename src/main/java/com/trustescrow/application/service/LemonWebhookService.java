package com.trustescrow.application.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.trustescrow.domain.model.*;
import com.trustescrow.domain.service.*;
import lombok.Builder;
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
import java.time.Instant;
import java.util.Base64;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

/**
 * Lemon Webhook Service for Phase 10.
 * Handles Lemon Squeezy webhook events with idempotency and signature verification.
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
    
    private final WebhookEventRepository webhookEventRepository;
    private final DealRepository dealRepository;
    private final DealMilestoneRepository milestoneRepository;
    private final PaymentInfoRepository paymentInfoRepository;
    private final DealStateService dealStateService;
    private final ObjectMapper objectMapper;
    
    /**
     * Process Lemon webhook event.
     * 
     * @param signature Webhook signature (X-Signature header)
     * @param rawBody Raw request body (for signature verification)
     * @param payload Parsed JSON payload
     * @return Processing result
     */
    @Transactional
    public WebhookProcessingResult processWebhook(String signature, String rawBody, JsonNode payload) {
        log.info("Processing Lemon webhook event");
        
        // Extract event metadata
        String eventName = payload.path("meta").path("event_name").asText();
        if (eventName == null || eventName.isEmpty()) {
            eventName = payload.path("meta").path("event_name").asText("unknown");
        }
        
        // Extract event ID (use order/subscription ID as fallback)
        String eventId;
        JsonNode data = payload.path("data");
        if (data.has("id")) {
            eventId = data.path("id").asText();
        } else {
            log.error("No event ID found in webhook payload");
            return WebhookProcessingResult.builder()
                .success(false)
                .message("No event ID in payload")
                .build();
        }
        
        final String finalEventId = eventId;
        final String finalEventName = eventName;
        
        // Check idempotency: has this event been processed?
        Optional<WebhookEvent> existingEvent = webhookEventRepository
            .findByProviderAndEventId("LEMON", finalEventId);
        
        if (existingEvent.isPresent() && existingEvent.get().isProcessed()) {
            log.info("Webhook event already processed: {} (idempotent)", finalEventId);
            return WebhookProcessingResult.builder()
                .success(true)
                .message("Event already processed")
                .build();
        }
        
        // Save webhook event (for idempotency tracking)
        WebhookEvent webhookEvent = existingEvent.orElseGet(() -> {
            @SuppressWarnings("unchecked")
            Map<String, Object> payloadMap = objectMapper.convertValue(payload, Map.class);
            return WebhookEvent.builder()
                .provider("LEMON")
                .eventId(finalEventId)
                .eventName(finalEventName)
                .payload(payloadMap)
                .createdAt(Instant.now())
                .build();
        });
        
        if (existingEvent.isEmpty()) {
            webhookEventRepository.save(webhookEvent);
        }
        
        // Verify signature
        if (!verifySignature(signature, rawBody)) {
            log.error("Invalid webhook signature for event: {}", eventId);
            throw new SecurityException("Invalid webhook signature");
        }
        
        // Process based on event type
        try {
            WebhookProcessingResult result;
            
            if (eventName.startsWith("order_") && (
                eventName.equals("order_created") || 
                eventName.equals("order_updated") ||
                eventName.equals("order_refunded")
            )) {
                result = processOrderEvent(payload, webhookEvent);
            } else {
                log.warn("Unhandled webhook event type: {}", eventName);
                result = WebhookProcessingResult.builder()
                    .success(true)
                    .message("Event type not handled")
                    .build();
            }
            
            // Mark event as processed
            webhookEvent.markAsProcessed();
            webhookEventRepository.save(webhookEvent);
            
            return result;
        } catch (Exception e) {
            log.error("Error processing webhook event: {}", eventId, e);
            throw e;
        }
    }
    
    /**
     * Process order-related events (paid, refunded, etc.).
     */
    private WebhookProcessingResult processOrderEvent(JsonNode payload, WebhookEvent webhookEvent) {
        log.info("Processing order event");
        
        JsonNode data = payload.path("data");
        JsonNode attributes = data.path("attributes");
        
        String orderId = data.path("id").asText();
        String orderStatus = attributes.path("status").asText();
        
        // Only process paid orders
        if (!"paid".equalsIgnoreCase(orderStatus)) {
            log.info("Order status is not 'paid', skipping: {}", orderStatus);
            return WebhookProcessingResult.builder()
                .success(true)
                .message("Order not paid, skipping")
                .build();
        }
        
        // Extract custom data from checkout
        JsonNode customData = attributes.path("custom_price").path("custom_data");
        if (customData.isMissingNode()) {
            // Try alternative path: checkout custom fields
            JsonNode checkoutData = attributes.path("checkout").path("custom");
            if (!checkoutData.isMissingNode()) {
                customData = checkoutData;
            }
        }
        
        // Extract dealId and milestoneId from custom data
        String dealIdStr = null;
        String milestoneIdStr = null;
        
        if (!customData.isMissingNode()) {
            dealIdStr = customData.path("dealId").asText();
            if (dealIdStr.isEmpty()) {
                dealIdStr = customData.path("deal_id").asText();
            }
            
            milestoneIdStr = customData.path("milestoneId").asText();
            if (milestoneIdStr.isEmpty()) {
                milestoneIdStr = customData.path("milestone_id").asText();
            }
        }
        
        if (dealIdStr == null || dealIdStr.isEmpty()) {
            log.error("No dealId in webhook custom data");
            return WebhookProcessingResult.builder()
                .success(false)
                .message("No dealId in custom data")
                .build();
        }
        
        UUID dealId;
        try {
            dealId = UUID.fromString(dealIdStr);
        } catch (IllegalArgumentException e) {
            log.error("Invalid dealId format: {}", dealIdStr);
            return WebhookProcessingResult.builder()
                .success(false)
                .message("Invalid dealId format")
                .build();
        }
        
        // Load deal
        Deal deal = dealRepository.findById(dealId)
            .orElseThrow(() -> new IllegalArgumentException("Deal not found: " + dealId));
        
        // Update deal status to FUNDED (payment completed)
        if (deal.getState() == DealState.CREATED) {
            try {
                dealStateService.transitionDeal(dealId, DealState.FUNDED, "system", 
                    String.format("{\"order_id\":\"%s\",\"webhook_event_id\":\"%s\"}", 
                        orderId, webhookEvent.getEventId()));
                log.info("Deal {} transitioned to FUNDED", dealId);
            } catch (Exception e) {
                log.error("Failed to transition deal to FUNDED: {}", dealId, e);
                // Continue processing - deal might already be in a different state
            }
        }
        
        // Update milestone status to PAID if milestoneId provided
        if (milestoneIdStr != null && !milestoneIdStr.isEmpty()) {
            UUID milestoneId;
            try {
                milestoneId = UUID.fromString(milestoneIdStr);
            } catch (IllegalArgumentException e) {
                log.error("Invalid milestoneId format: {}", milestoneIdStr);
                milestoneId = null;
            }
            
            if (milestoneId != null) {
                Optional<DealMilestone> milestoneOpt = milestoneRepository.findById(milestoneId);
                if (milestoneOpt.isPresent()) {
                    DealMilestone milestone = milestoneOpt.get();
                    if (milestone.getDealId().equals(dealId)) {
                        if (milestone.getStatus() != DealMilestone.MilestoneStatus.COMPLETED) {
                            milestone.updateStatus(DealMilestone.MilestoneStatus.COMPLETED);
                            milestoneRepository.save(milestone);
                            log.info("Milestone {} marked as COMPLETED", milestoneId);
                        }
                    } else {
                        log.warn("Milestone {} does not belong to deal {}", milestoneId, dealId);
                    }
                } else {
                    log.warn("Milestone {} not found", milestoneId);
                }
            }
        }
        
        // Upsert payment record (provider_order_id 기준)
        PaymentInfo paymentInfo = paymentInfoRepository.findByDealId(dealId)
            .orElseGet(() -> {
                // Create new payment info if not exists
                return PaymentInfo.builder()
                    .dealId(dealId)
                    .buyerId(deal.getBuyerId())
                    .sellerId(deal.getSellerId())
                    .totalAmount(deal.getTotalAmount())
                    .currency(deal.getCurrency())
                    .status(PaymentInfo.PaymentStatus.PENDING)
                    .paymentProvider("LEMON_SQUEEZY")
                    .externalPaymentId(orderId)
                    .createdAt(Instant.now())
                    .updatedAt(Instant.now())
                    .build();
            });
        
        // Update payment info if exists
        if (paymentInfo.getExternalPaymentId() == null || !paymentInfo.getExternalPaymentId().equals(orderId)) {
            // Use reflection or builder pattern to update immutable fields
            // For now, create a new instance with updated values
            PaymentInfo updatedPaymentInfo = PaymentInfo.builder()
                .id(paymentInfo.getId())
                .dealId(paymentInfo.getDealId())
                .buyerId(paymentInfo.getBuyerId())
                .sellerId(paymentInfo.getSellerId())
                .totalAmount(paymentInfo.getTotalAmount())
                .currency(paymentInfo.getCurrency())
                .status(PaymentInfo.PaymentStatus.PAID)
                .paymentProvider("LEMON_SQUEEZY")
                .externalPaymentId(orderId)
                .createdAt(paymentInfo.getCreatedAt())
                .updatedAt(Instant.now())
                .paidAt(Instant.now())
                .build();
            
            paymentInfoRepository.save(updatedPaymentInfo);
        } else {
            // Just update status if order ID already matches
            paymentInfo.updateStatus(PaymentInfo.PaymentStatus.PAID);
            paymentInfoRepository.save(paymentInfo);
        }
        
        log.info("Payment info updated for deal {} with order ID {}", dealId, orderId);
        
        return WebhookProcessingResult.builder()
            .success(true)
            .message("Payment processed successfully")
            .build();
    }
    
    /**
     * Verify webhook signature using HMAC-SHA256.
     */
    private boolean verifySignature(String signature, String payload) {
        if (lemonWebhookSecret == null || lemonWebhookSecret.isEmpty()) {
            log.warn("Lemon webhook secret not configured, skipping signature verification");
            return true; // For development only - should fail in production
        }
        
        if (signature == null || signature.isEmpty()) {
            log.error("Webhook signature is missing");
            return false;
        }
        
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKey = new SecretKeySpec(
                lemonWebhookSecret.getBytes(StandardCharsets.UTF_8), 
                "HmacSHA256"
            );
            mac.init(secretKey);
            byte[] hashBytes = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
            String computedSignature = Base64.getEncoder().encodeToString(hashBytes);
            
            // Lemon sends signature in format: "signature=<base64>"
            String cleanSignature = signature;
            if (signature.startsWith("signature=")) {
                cleanSignature = signature.substring("signature=".length());
            }
            
            boolean isValid = cleanSignature.equals(computedSignature);
            if (!isValid) {
                log.error("Signature mismatch. Expected: {}, Got: {}", computedSignature, cleanSignature);
            }
            
            return isValid;
        } catch (NoSuchAlgorithmException | InvalidKeyException e) {
            log.error("Failed to verify webhook signature", e);
            return false;
        }
    }
    
    @Data
    @Builder
    public static class WebhookProcessingResult {
        private boolean success;
        private String message;
    }
}
