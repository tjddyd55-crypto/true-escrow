package com.trustescrow.application.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.trustescrow.domain.model.*;
import com.trustescrow.domain.service.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.Base64;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

/**
 * Lemon Webhook Service - Safe and defensive implementation.
 * 
 * Principles:
 * - Never throw exceptions that crash the server
 * - Always return 200 OK to webhook
 * - Idempotency: same event processed only once
 * - Signature verification failure does not affect DB/logic
 * - Defensive parsing for payload structure changes
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
    private final EscrowStateService escrowStateService;
    private final ObjectMapper objectMapper;
    
    /**
     * Process Lemon webhook event (STEP 2-5).
     * 
     * @param signature Webhook signature (X-Signature header)
     * @param rawBody Raw request body (for signature verification)
     * @param payload Parsed JSON payload
     * @return true if processed successfully, false if ignored
     */
    @Transactional
    public boolean processWebhook(String signature, String rawBody, JsonNode payload) {
        log.info("===== LEMON WEBHOOK PROCESSING START =====");
        
        try {
            // STEP 1: Parse payload (defensive)
            ParsedWebhookData parsed = parsePayload(payload);
            if (parsed == null) {
                log.warn("Failed to parse webhook payload, ignoring");
                return false;
            }
            
            // STEP 1: Log parsed data in required format
            log.info("===== LEMON WEBHOOK PARSED =====");
            log.info("event: {}", parsed.eventName != null ? parsed.eventName : "(missing)");
            log.info("dealId: {}", parsed.dealId != null ? parsed.dealId : "(missing)");
            log.info("milestoneId: {}", parsed.milestoneId != null ? parsed.milestoneId : "(missing)");
            log.info("==============================");
            
            // STEP 1: Validate conditions - accept order_created or order_paid
            if (!"order_created".equals(parsed.eventName) && !"order_paid".equals(parsed.eventName)) {
                log.info("Event name is not 'order_created' or 'order_paid': {}, ignoring", parsed.eventName);
                return false;
            }
            
            if (parsed.dealId == null || parsed.dealId.isEmpty()) {
                log.warn("dealId not found in webhook custom_data, ignoring");
                return false;
            }
            
            // For order_paid, status check is optional (order_paid itself means paid)
            // For order_created, check status == "paid"
            if ("order_created".equals(parsed.eventName) && !"paid".equalsIgnoreCase(parsed.orderStatus)) {
                log.info("Order status is not 'paid': {}, ignoring", parsed.orderStatus);
                return false;
            }
            
            log.info("Webhook validated: event={}, dealId={}, milestoneId={}, orderId={}, status={}", 
                parsed.eventName, parsed.dealId, parsed.milestoneId, parsed.orderId, parsed.orderStatus);
            
            // STEP 5: Verify signature (before any DB operations)
            if (!verifySignature(signature, rawBody)) {
                log.warn("Invalid Lemon webhook signature, ignoring (no DB changes)");
                return false; // Return false but still 200 OK
            }
            
            // STEP 3: Idempotency check
            Optional<WebhookEvent> existingEvent = webhookEventRepository
                .findByProviderAndEventId("LEMON", parsed.orderId);
            
            if (existingEvent.isPresent() && existingEvent.get().isProcessed()) {
                log.info("Duplicate webhook ignored (already processed): orderId={}", parsed.orderId);
                return true; // Already processed, return success
            }
            
            // Save webhook event for idempotency (before business logic)
            WebhookEvent webhookEvent = existingEvent.orElseGet(() -> {
                @SuppressWarnings("unchecked")
                Map<String, Object> payloadMap = objectMapper.convertValue(payload, Map.class);
                return WebhookEvent.builder()
                    .provider("LEMON")
                    .eventId(parsed.orderId)
                    .eventName(parsed.eventName)
                    .payload(payloadMap)
                    .createdAt(Instant.now())
                    .build();
            });
            
            if (existingEvent.isEmpty()) {
                webhookEventRepository.save(webhookEvent);
            }
            
            // STEP 2: Update in-memory escrow state (milestone status)
            try {
                if (parsed.milestoneId != null && !parsed.milestoneId.isEmpty()) {
                    escrowStateService.setMilestoneFunded(parsed.dealId, parsed.milestoneId);
                    log.info("Milestone {} for deal {} set to FUNDED", parsed.milestoneId, parsed.dealId);
                } else {
                    log.warn("milestoneId not found in webhook, skipping milestone state update");
                }
                
                // STEP 4: Update DB escrow state (Deal / Milestone / Payment) - optional for now
                // updateEscrowState(parsed);
                
                // Mark as processed only after successful update
                webhookEvent.markAsProcessed();
                webhookEventRepository.save(webhookEvent);
                
                log.info("===== LEMON WEBHOOK PROCESSING SUCCESS =====");
                return true;
            } catch (Exception e) {
                log.error("Failed to update escrow state for dealId={}, orderId={}: {}", 
                    parsed.dealId, parsed.orderId, e.getMessage(), e);
                // Don't mark as processed - let Lemon retry
                // Transaction will rollback automatically
                throw e; // Re-throw to trigger rollback
            }
            
        } catch (Exception e) {
            // Catch all exceptions to prevent server crash
            log.error("Unexpected error processing webhook (will return 200 OK): {}", e.getMessage(), e);
            return false;
        }
    }
    
    /**
     * STEP 2: Parse payload defensively.
     * 
     * Supports multiple payload formats:
     * - meta.event_name
     * - meta.custom_data.dealId / milestoneId
     * - data.attributes.custom.checkout_data (alternative format)
     */
    private ParsedWebhookData parsePayload(JsonNode payload) {
        try {
            ParsedWebhookData parsed = new ParsedWebhookData();
            
            // Parse event_name (meta.event_name or event_name)
            JsonNode meta = payload.path("meta");
            parsed.eventName = meta.path("event_name").asText(null);
            if (parsed.eventName == null || parsed.eventName.isEmpty()) {
                parsed.eventName = payload.path("event_name").asText(null);
            }
            
            // Parse custom_data.dealId (primary path)
            JsonNode customData = meta.path("custom_data");
            parsed.dealId = customData.path("dealId").asText(null);
            if (parsed.dealId == null || parsed.dealId.isEmpty()) {
                parsed.dealId = customData.path("deal_id").asText(null); // Fallback
            }
            
            parsed.milestoneId = customData.path("milestoneId").asText(null);
            if (parsed.milestoneId == null || parsed.milestoneId.isEmpty()) {
                parsed.milestoneId = customData.path("milestone_id").asText(null); // Fallback
            }
            
            // Alternative: data.attributes.custom.checkout_data
            if (parsed.dealId == null || parsed.dealId.isEmpty()) {
                JsonNode data = payload.path("data");
                JsonNode attributes = data.path("attributes");
                JsonNode custom = attributes.path("custom");
                JsonNode checkoutData = custom.path("checkout_data");
                
                if (checkoutData != null && !checkoutData.isMissingNode()) {
                    parsed.dealId = checkoutData.path("dealId").asText(null);
                    if (parsed.dealId == null || parsed.dealId.isEmpty()) {
                        parsed.dealId = checkoutData.path("deal_id").asText(null);
                    }
                    
                    parsed.milestoneId = checkoutData.path("milestoneId").asText(null);
                    if (parsed.milestoneId == null || parsed.milestoneId.isEmpty()) {
                        parsed.milestoneId = checkoutData.path("milestone_id").asText(null);
                    }
                }
            }
            
            // Parse data.id (order ID)
            JsonNode data = payload.path("data");
            parsed.orderId = data.path("id").asText(null);
            
            // Parse data.attributes.status
            JsonNode attributes = data.path("attributes");
            parsed.orderStatus = attributes.path("status").asText(null);
            
            // Parse amount and currency
            String totalStr = attributes.path("total").asText(null);
            if (totalStr != null && !totalStr.isEmpty()) {
                try {
                    parsed.totalAmount = new BigDecimal(totalStr);
                } catch (NumberFormatException e) {
                    log.warn("Invalid total amount format: {}", totalStr);
                }
            }
            parsed.currency = attributes.path("currency").asText(null);
            
            return parsed;
        } catch (Exception e) {
            log.error("Failed to parse webhook payload: {}", e.getMessage(), e);
            return null;
        }
    }
    
    /**
     * STEP 4: Update escrow state (Deal / Milestone / Payment).
     */
    private void updateEscrowState(ParsedWebhookData parsed) {
        UUID dealId;
        try {
            dealId = UUID.fromString(parsed.dealId);
        } catch (IllegalArgumentException e) {
            log.error("Invalid dealId format: {}", parsed.dealId);
            throw new IllegalArgumentException("Invalid dealId format: " + parsed.dealId);
        }
        
        // Load deal with lock (for transaction safety)
        Deal deal = dealRepository.findByIdWithLock(dealId)
            .orElseThrow(() -> new IllegalArgumentException("Deal not found: " + dealId));
        
        // Update Deal: CREATED → FUNDED (equivalent to PENDING → ACTIVE)
        if (deal.getState() == DealState.CREATED) {
            try {
                dealStateService.transitionDeal(dealId, DealState.FUNDED, "system", 
                    String.format("{\"order_id\":\"%s\",\"webhook\":\"lemon\"}", parsed.orderId));
                log.info("Deal {} transitioned from CREATED to FUNDED", dealId);
            } catch (Exception e) {
                log.error("Failed to transition deal {} to FUNDED: {}", dealId, e.getMessage());
                throw e;
            }
        } else {
            log.info("Deal {} is already in state {}, skipping transition", dealId, deal.getState());
        }
        
        // Update Milestone if milestoneId provided
        if (parsed.milestoneId != null && !parsed.milestoneId.isEmpty()) {
            UUID milestoneId;
            try {
                milestoneId = UUID.fromString(parsed.milestoneId);
            } catch (IllegalArgumentException e) {
                log.warn("Invalid milestoneId format: {}", parsed.milestoneId);
                milestoneId = null;
            }
            
            if (milestoneId != null) {
                Optional<DealMilestone> milestoneOpt = milestoneRepository.findById(milestoneId);
                if (milestoneOpt.isPresent()) {
                    DealMilestone milestone = milestoneOpt.get();
                    if (milestone.getDealId().equals(dealId)) {
                        if (milestone.getStatus() == DealMilestone.MilestoneStatus.PENDING) {
                            milestone.updateStatus(DealMilestone.MilestoneStatus.COMPLETED);
                            milestoneRepository.save(milestone);
                            log.info("Milestone {} marked as COMPLETED (PAID)", milestoneId);
                        } else {
                            log.info("Milestone {} already in status {}, skipping", 
                                milestoneId, milestone.getStatus());
                        }
                    } else {
                        log.warn("Milestone {} does not belong to deal {}", milestoneId, dealId);
                    }
                } else {
                    log.warn("Milestone {} not found", milestoneId);
                }
            }
        }
        
        // Upsert PaymentInfo
        Optional<PaymentInfo> paymentOpt = paymentInfoRepository.findByDealId(dealId);
        PaymentInfo payment;
        
        if (paymentOpt.isPresent()) {
            payment = paymentOpt.get();
            // Update existing payment
            if (payment.getExternalPaymentId() == null || 
                !payment.getExternalPaymentId().equals(parsed.orderId)) {
                // Create new payment record with updated info
                payment = PaymentInfo.builder()
                    .id(payment.getId())
                    .dealId(payment.getDealId())
                    .buyerId(payment.getBuyerId())
                    .sellerId(payment.getSellerId())
                    .totalAmount(parsed.totalAmount != null ? parsed.totalAmount : payment.getTotalAmount())
                    .currency(parsed.currency != null ? parsed.currency : payment.getCurrency())
                    .status(PaymentInfo.PaymentStatus.PAID)
                    .paymentProvider("LEMON_SQUEEZY")
                    .externalPaymentId(parsed.orderId)
                    .createdAt(payment.getCreatedAt())
                    .updatedAt(Instant.now())
                    .paidAt(Instant.now())
                    .build();
            } else {
                // Same order ID, just update status
                payment.updateStatus(PaymentInfo.PaymentStatus.PAID);
            }
        } else {
            // Create new payment record
            payment = PaymentInfo.builder()
                .dealId(dealId)
                .buyerId(deal.getBuyerId())
                .sellerId(deal.getSellerId())
                .totalAmount(parsed.totalAmount != null ? parsed.totalAmount : deal.getTotalAmount())
                .currency(parsed.currency != null ? parsed.currency : deal.getCurrency())
                .status(PaymentInfo.PaymentStatus.PAID)
                .paymentProvider("LEMON_SQUEEZY")
                .externalPaymentId(parsed.orderId)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .paidAt(Instant.now())
                .build();
        }
        
        paymentInfoRepository.save(payment);
        log.info("PaymentInfo updated/created for deal {} with orderId {}", dealId, parsed.orderId);
    }
    
    /**
     * STEP 5: Verify webhook signature using HMAC-SHA256.
     */
    private boolean verifySignature(String signature, String payload) {
        if (lemonWebhookSecret == null || lemonWebhookSecret.isEmpty()) {
            log.warn("Lemon webhook secret not configured, skipping signature verification");
            return true; // For development only - should fail in production
        }
        
        if (signature == null || signature.isEmpty()) {
            log.warn("Webhook signature is missing");
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
            
            // Lemon sends signature in format: "signature=<base64>" or just base64
            String cleanSignature = signature;
            if (signature.startsWith("signature=")) {
                cleanSignature = signature.substring("signature=".length());
            }
            
            boolean isValid = cleanSignature.equals(computedSignature);
            if (!isValid) {
                log.warn("Signature mismatch. Expected: {}, Got: {}", computedSignature, cleanSignature);
            }
            
            return isValid;
        } catch (NoSuchAlgorithmException | InvalidKeyException e) {
            log.error("Failed to verify webhook signature", e);
            return false;
        }
    }
    
    /**
     * Parsed webhook data structure.
     */
    private static class ParsedWebhookData {
        String eventName;
        String dealId;
        String milestoneId;
        String orderId;
        String orderStatus;
        BigDecimal totalAmount;
        String currency;
    }
}
