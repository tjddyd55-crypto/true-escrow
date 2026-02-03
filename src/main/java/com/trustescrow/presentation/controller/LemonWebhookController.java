package com.trustescrow.presentation.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.trustescrow.application.service.LemonWebhookService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StreamUtils;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.io.IOException;
import java.nio.charset.StandardCharsets;

/**
 * Lemon Webhook Controller - Safe and defensive implementation.
 * 
 * This webhook is called by external payment system (Lemon Squeezy),
 * so server stability must never be compromised.
 * 
 * Principles:
 * - Always return 200 OK (even on errors)
 * - Never throw exceptions that crash the server
 * - Log all steps for traceability
 */
@RestController
@RequestMapping("/api/webhooks/lemonsqueezy")
@RequiredArgsConstructor
@Slf4j
public class LemonWebhookController {
    
    private final LemonWebhookService webhookService;
    private final ObjectMapper objectMapper;
    
    /**
     * Handle Lemon webhook event.
     * 
     * POST /api/webhooks/lemonsqueezy
     * 
     * Headers:
     * - X-Signature: Webhook signature
     * 
     * Body: Raw JSON payload
     */
    @PostMapping
    public ResponseEntity<?> handleWebhook(
            @RequestHeader(value = "X-Signature", required = false) String signature,
            HttpServletRequest request) {
        
        log.info("[WEBHOOK] Received webhook event");
        
        try {
            // STEP 1: Read raw body (required for signature verification)
            String rawBody = StreamUtils.copyToString(
                request.getInputStream(), 
                StandardCharsets.UTF_8
            );
            
            if (rawBody == null || rawBody.isEmpty()) {
                log.warn("[WEBHOOK] Payload is empty");
                return ResponseEntity.ok().build(); // Still 200 OK
            }
            
            log.info("[WEBHOOK] Payload length: {} bytes", rawBody.length());
            
            // Parse JSON payload (defensive)
            JsonNode payload;
            try {
                payload = objectMapper.readTree(rawBody);
                // Extract event name for logging
                String eventName = payload.path("meta").path("event_name").asText("unknown");
                log.info("[WEBHOOK] Event: {}", eventName);
            } catch (Exception e) {
                log.warn("[WEBHOOK] Failed to parse payload as JSON: {}", e.getMessage());
                return ResponseEntity.ok().build(); // Still 200 OK
            }
            
            // STEP 2: Process webhook (all steps inside service)
            boolean processed = webhookService.processWebhook(signature, rawBody, payload);
            
            if (processed) {
                log.info("[WEBHOOK] Processed successfully (200 OK)");
            } else {
                log.info("[WEBHOOK] Ignored (200 OK)");
            }
            
            // Always return 200 OK (even if ignored or failed)
            return ResponseEntity.ok().build();
            
        } catch (IOException e) {
            log.error("Failed to read webhook request body: {}", e.getMessage());
            return ResponseEntity.ok().build(); // Still 200 OK
        } catch (Exception e) {
            // Catch all exceptions to prevent server crash
            log.error("Unexpected error processing webhook (returning 200 OK): {}", e.getMessage(), e);
            return ResponseEntity.ok().build(); // Always 200 OK
        }
    }
}
