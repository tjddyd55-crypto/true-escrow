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
    private final BlockchainService blockchainService; // STEP 7
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
                log.warn("===== STEP 1: PARSING FAILED - IGNORING WEBHOOK =====");
                return false;
            }
            
            // STEP 1: Log parsed data in required format (per spec)
            log.info("[WEBHOOK] Parsed: event={}, dealId={}, milestoneId={}, orderId={}", 
                parsed.eventName != null ? parsed.eventName : "(missing)",
                parsed.dealId != null ? parsed.dealId : "(missing)",
                parsed.milestoneId != null ? parsed.milestoneId : "(missing)",
                parsed.orderId != null ? parsed.orderId : "(missing)");
            
            // STEP 1: Validate conditions - accept order_created, order_paid, or order_refunded
            if (!"order_created".equals(parsed.eventName) && 
                !"order_paid".equals(parsed.eventName) && 
                !"order_refunded".equals(parsed.eventName)) {
                log.info("[WEBHOOK] Ignoring event: {} (not order_created/order_paid/order_refunded)", parsed.eventName);
                return false;
            }
            
            if (parsed.dealId == null || parsed.dealId.isEmpty()) {
                log.warn("[WEBHOOK] dealId not found in custom_data, ignoring");
                return false;
            }
            
            // For order_paid, status check is optional (order_paid itself means paid)
            // For order_created, check status == "paid"
            if ("order_created".equals(parsed.eventName) && !"paid".equalsIgnoreCase(parsed.orderStatus)) {
                log.info("[WEBHOOK] Order status is not 'paid': {}, ignoring", parsed.orderStatus);
                return false;
            }
            
            log.info("[WEBHOOK] Validated: event={}, dealId={}, milestoneId={}, orderId={}", 
                parsed.eventName, parsed.dealId, parsed.milestoneId, parsed.orderId);
            
            // STEP 3: Idempotency check (before signature verification for performance)
            Optional<WebhookEvent> existingEvent = webhookEventRepository
                .findByProviderAndEventId("LEMON", parsed.orderId);
            
            if (existingEvent.isPresent() && existingEvent.get().isProcessed()) {
                log.info("[WEBHOOK] Duplicate event ignored (already processed): orderId={}", parsed.orderId);
                return true; // Already processed, return success
            }
            
            // STEP 3: Verify signature (before any DB operations)
            if (!verifySignature(signature, rawBody)) {
                log.warn("[WEBHOOK] Invalid signature, ignoring (no DB changes)");
                return false; // Return false but still 200 OK
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
            
            // STEP 2: Update Deal / Milestone State Machine
            log.info("===== STEP 2: DEAL / MILESTONE STATE MACHINE START =====");
            try {
                updateDealMilestoneState(parsed);
                
                // Mark as processed only after successful update
                webhookEvent.markAsProcessed();
                webhookEventRepository.save(webhookEvent);
                
                log.info("[WEBHOOK] Processing completed successfully");
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
     * STEP 1: Parse payload defensively with detailed logging.
     * 
     * Supports multiple payload formats:
     * - meta.event_name
     * - meta.custom_data.dealId / milestoneId
     * - data.attributes.custom.checkout_data (primary path per spec)
     */
    /**
     * STEP 1: Parse webhook payload defensively.
     * Extracts: event_name, dealId, milestoneId, orderId, checkoutId, orderStatus
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
            
            // STEP 1: Primary path - data.attributes.custom.checkout_data (per spec)
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
            
            // Fallback: meta.custom_data.dealId / milestoneId
            if (parsed.dealId == null || parsed.dealId.isEmpty()) {
                JsonNode customData = meta.path("custom_data");
                parsed.dealId = customData.path("dealId").asText(null);
                if (parsed.dealId == null || parsed.dealId.isEmpty()) {
                    parsed.dealId = customData.path("deal_id").asText(null);
                }
                
                parsed.milestoneId = customData.path("milestoneId").asText(null);
                if (parsed.milestoneId == null || parsed.milestoneId.isEmpty()) {
                    parsed.milestoneId = customData.path("milestone_id").asText(null);
                }
            }
            
            // Parse data.id (order ID)
            parsed.orderId = data.path("id").asText(null);
            
            // STEP 1: Parse checkout_id (from relationships or attributes)
            JsonNode relationships = data.path("relationships");
            JsonNode checkout = relationships.path("checkout");
            JsonNode checkoutDataNode = checkout.path("data");
            parsed.checkoutId = checkoutDataNode.path("id").asText(null);
            if (parsed.checkoutId == null || parsed.checkoutId.isEmpty()) {
                parsed.checkoutId = attributes.path("checkout_id").asText(null);
            }
            
            // Parse data.attributes.status
            parsed.orderStatus = attributes.path("status").asText(null);
            
            // Parse amount and currency
            String totalStr = attributes.path("total").asText(null);
            if (totalStr != null && !totalStr.isEmpty()) {
                try {
                    parsed.totalAmount = new BigDecimal(totalStr);
                } catch (NumberFormatException e) {
                    log.warn("[WEBHOOK] Invalid total amount format: {}", totalStr);
                }
            }
            parsed.currency = attributes.path("currency").asText(null);
            
            return parsed;
        } catch (Exception e) {
            log.error("[WEBHOOK] Failed to parse payload: {}", e.getMessage(), e);
            return null;
        }
    }
    
    /**
     * STEP 2: Update Deal / Milestone State Machine.
     * 
     * Rules:
     * - order_created (paid) → Milestone = PAID_HELD
     * - order_refunded → Milestone = REFUNDED
     * - First milestone paid → Deal = FUNDS_HELD
     * - No automatic release
     */
    private void updateDealMilestoneState(ParsedWebhookData parsed) {
        log.info("===== STEP 2: STATE MACHINE UPDATE =====");
        log.info("Event: {}, DealId: {}, MilestoneId: {}", 
            parsed.eventName, parsed.dealId, parsed.milestoneId);
        
        // Handle order_refunded
        if ("order_refunded".equals(parsed.eventName)) {
            log.info("Processing order_refunded event");
            handleOrderRefunded(parsed);
            return;
        }
        
        // Handle order_created / order_paid
        if ("order_created".equals(parsed.eventName) || "order_paid".equals(parsed.eventName)) {
            log.info("Processing order_created/order_paid event");
            handleOrderPaid(parsed);
            return;
        }
        
        log.warn("Unhandled event type: {}", parsed.eventName);
    }
    
    /**
     * STEP 2: Handle order_created / order_paid → Milestone = PAID_HELD
     */
    private void handleOrderPaid(ParsedWebhookData parsed) {
        if (parsed.dealId == null || parsed.dealId.isEmpty()) {
            log.warn("dealId is missing, cannot update state");
            return;
        }
        
        // Try to parse dealId as UUID, if fails use as string (for demo deals)
        UUID dealUuid = null;
        try {
            dealUuid = UUID.fromString(parsed.dealId);
        } catch (IllegalArgumentException e) {
            log.info("dealId is not UUID format, using as string: {}", parsed.dealId);
        }
        
            // STEP 2: Update milestone status to PAID_HELD
            if (parsed.milestoneId != null && !parsed.milestoneId.isEmpty()) {
                UUID milestoneUuid = null;
                try {
                    milestoneUuid = UUID.fromString(parsed.milestoneId);
                } catch (IllegalArgumentException e) {
                    log.info("milestoneId is not UUID format, using as string: {}", parsed.milestoneId);
                }
                
                if (milestoneUuid != null && dealUuid != null) {
                    // Update DB milestone
                    Optional<DealMilestone> milestoneOpt = milestoneRepository.findByDealIdAndId(dealUuid, milestoneUuid);
                    if (milestoneOpt.isPresent()) {
                        DealMilestone milestone = milestoneOpt.get();
                        if (milestone.getStatus() == DealMilestone.MilestoneStatus.PENDING) {
                            milestone.updateStatus(DealMilestone.MilestoneStatus.PAID_HELD);
                            milestoneRepository.save(milestone);
                            log.info("[ESCROW] deal={} milestone={} → PAID_HELD (orderId={})", 
                                parsed.dealId, parsed.milestoneId, parsed.orderId);
                        } else {
                            log.info("[ESCROW] deal={} milestone={} already in status {}, skipping", 
                                parsed.dealId, parsed.milestoneId, milestone.getStatus());
                        }
                    } else {
                        log.warn("Milestone {} not found for deal {}", milestoneUuid, dealUuid);
                    }
                }
                
                // Update in-memory state (for demo deals with string IDs)
                escrowStateService.setMilestonePaidHeld(parsed.dealId, parsed.milestoneId); // Uses FUNDS_HELD internally
                log.info("[ESCROW] In-memory state updated: deal={} milestone={} → FUNDS_HELD", 
                    parsed.dealId, parsed.milestoneId);
            
            // STEP 7: Record on-chain (if milestone is UUID format)
            if (milestoneUuid != null && dealUuid != null) {
                try {
                    blockchainService.recordMilestoneStatus(
                        dealUuid, 
                        milestoneUuid, 
                        com.trustescrow.domain.model.OnChainRecord.RecordStatus.FUNDS_HELD,
                        "SYSTEM"
                    );
                } catch (Exception e) {
                    log.warn("[BLOCKCHAIN] Failed to record on-chain (non-critical): {}", e.getMessage());
                }
            }
            } else {
                log.warn("[ESCROW] milestoneId is missing, cannot update milestone state");
            }
        
        // STEP 2: Update Deal status: First milestone paid → Deal = FUNDS_HELD
        if (dealUuid != null) {
            Optional<Deal> dealOpt = dealRepository.findById(dealUuid);
            if (dealOpt.isPresent()) {
                Deal deal = dealOpt.get();
                if (deal.getState() == DealState.CREATED) {
                    try {
                        dealStateService.transitionDeal(dealUuid, DealState.FUNDS_HELD, "system", 
                            String.format("{\"order_id\":\"%s\",\"webhook\":\"lemon\"}", parsed.orderId));
                        log.info("[ESCROW] deal={} → FUNDS_HELD (first milestone paid)", parsed.dealId);
                    } catch (Exception e) {
                        log.error("Failed to transition deal {} to FUNDS_HELD: {}", dealUuid, e.getMessage());
                    }
                } else {
                    log.info("[ESCROW] deal={} already in state {}, skipping transition", 
                        parsed.dealId, deal.getState());
                }
            }
        } else {
            log.info("[ESCROW] dealId is not UUID format, skipping DB deal state update (using in-memory only)");
        }
    }
    
    /**
     * STEP 2: Handle order_refunded → Milestone = REFUNDED
     */
    private void handleOrderRefunded(ParsedWebhookData parsed) {
        if (parsed.dealId == null || parsed.dealId.isEmpty() || 
            parsed.milestoneId == null || parsed.milestoneId.isEmpty()) {
            log.warn("dealId or milestoneId is missing, cannot process refund");
            return;
        }
        
        UUID dealUuid = null;
        UUID milestoneUuid = null;
        
        try {
            dealUuid = UUID.fromString(parsed.dealId);
            milestoneUuid = UUID.fromString(parsed.milestoneId);
        } catch (IllegalArgumentException e) {
            log.info("dealId or milestoneId is not UUID format, using in-memory state only");
        }
        
        // STEP 2: Update DB milestone if UUIDs are valid
        if (dealUuid != null && milestoneUuid != null) {
            Optional<DealMilestone> milestoneOpt = milestoneRepository.findByDealIdAndId(dealUuid, milestoneUuid);
            if (milestoneOpt.isPresent()) {
                DealMilestone milestone = milestoneOpt.get();
                if (milestone.getStatus() == DealMilestone.MilestoneStatus.PAID_HELD) {
                    milestone.updateStatus(DealMilestone.MilestoneStatus.REFUNDED);
                    milestoneRepository.save(milestone);
                    log.info("[ESCROW] deal={} milestone={} → REFUNDED (orderId={})", 
                        parsed.dealId, parsed.milestoneId, parsed.orderId);
                } else {
                    log.info("[ESCROW] deal={} milestone={} is in status {}, cannot refund", 
                        parsed.dealId, parsed.milestoneId, milestone.getStatus());
                }
            }
        }
        
        // Update in-memory state
        escrowStateService.setMilestoneRefunded(parsed.dealId, parsed.milestoneId);
        log.info("[ESCROW] In-memory state updated: deal={} milestone={} → REFUNDED", 
            parsed.dealId, parsed.milestoneId);
    }
    
    /**
     * STEP 4: Update escrow state (Deal / Milestone / Payment) - Legacy method.
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
        String checkoutId; // STEP 1: Add checkout_id
        String orderStatus;
        BigDecimal totalAmount;
        String currency;
    }
}
