package com.trustescrow.presentation.controller;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StreamUtils;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.io.IOException;
import java.nio.charset.StandardCharsets;

/**
 * Lemon Webhook Controller - STEP 1: Basic endpoint for webhook testing.
 * 
 * Current stage: Log only, no business logic, no DB operations.
 * Purpose: Enable Lemon webhook connection testing and approval.
 */
@RestController
@RequestMapping("/api/webhooks/lemonsqueezy")
@Slf4j
public class LemonWebhookController {
    
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
        
        log.info("===== LEMON WEBHOOK RECEIVED =====");
        
        try {
            // Read raw body
            String payload = StreamUtils.copyToString(
                request.getInputStream(), 
                StandardCharsets.UTF_8
            );
            
            // Log signature and payload
            log.info("X-Signature: {}", signature != null ? signature : "(missing)");
            log.info("Payload: {}", payload);
            log.info("Payload length: {} bytes", payload != null ? payload.length() : 0);
            
            // Always return 200 OK for now (testing phase)
            log.info("===== LEMON WEBHOOK PROCESSED (200 OK) =====");
            return ResponseEntity.ok().build();
            
        } catch (IOException e) {
            log.error("Failed to read webhook request body", e);
            return ResponseEntity.status(500).build();
        } catch (Exception e) {
            log.error("Unexpected error processing webhook", e);
            return ResponseEntity.status(500).build();
        }
    }
}
