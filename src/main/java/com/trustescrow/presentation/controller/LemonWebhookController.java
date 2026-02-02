package com.trustescrow.presentation.controller;

import com.trustescrow.application.service.LemonWebhookService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Lemon Webhook Controller for Phase 10.
 * Handles Lemon Squeezy webhook events.
 * 
 * CRITICAL: Only Lemon webhooks are trusted for payment confirmation.
 */
@RestController
@RequestMapping("/api/webhooks/lemon")
@RequiredArgsConstructor
@Slf4j
public class LemonWebhookController {
    
    private final LemonWebhookService webhookService;
    
    /**
     * Handle Lemon webhook event.
     * 
     * POST /api/webhooks/lemon
     */
    @PostMapping
    public ResponseEntity<?> handleWebhook(
            @RequestHeader(value = "X-Signature", required = false) String signature,
            @RequestBody String payload) {
        
        log.info("Received Lemon webhook event");
        
        try {
            LemonWebhookService.WebhookProcessingResult result = 
                webhookService.processWebhook(signature, payload);
            
            if (result.isSuccess()) {
                return ResponseEntity.ok().build();
            } else {
                return ResponseEntity.badRequest().body(result.getMessage());
            }
        } catch (SecurityException e) {
            log.error("Webhook signature verification failed", e);
            return ResponseEntity.status(401).build();
        } catch (Exception e) {
            log.error("Error processing webhook", e);
            return ResponseEntity.status(500).build();
        }
    }
}
