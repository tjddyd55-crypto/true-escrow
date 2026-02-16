package com.trustescrow.presentation.controller;

import com.trustescrow.application.dto.ApiResponse;
import com.trustescrow.application.dto.InvoiceResponse;
import com.trustescrow.application.service.InvoiceService;
import com.trustescrow.domain.model.Invoice;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.UUID;

/**
 * Invoice Controller for Phase 9.
 * Handles invoice generation and payment marking.
 */
@RestController
@RequestMapping("/api/invoices")
@RequiredArgsConstructor
@Slf4j
public class InvoiceController {
    
    private final InvoiceService invoiceService;
    
    /**
     * Generate monthly invoices (scheduled job endpoint).
     * Internal use only.
     */
    @PostMapping("/generate")
    public ResponseEntity<ApiResponse<String>> generateMonthlyInvoices() {
        log.info("Generating monthly invoices");
        invoiceService.generateMonthlyInvoices();
        return ResponseEntity.ok(ApiResponse.success("Invoices generated"));
    }
    
    /**
     * Get invoice by ID.
     */
    @GetMapping("/{invoiceId}")
    public ResponseEntity<ApiResponse<InvoiceResponse>> getInvoice(@PathVariable UUID invoiceId) {
        Invoice invoice = invoiceService.getInvoice(invoiceId);
        InvoiceResponse response = InvoiceResponse.from(invoice);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
    
    /**
     * Mark invoice as sent.
     */
    @PostMapping("/{invoiceId}/mark-sent")
    public ResponseEntity<ApiResponse<InvoiceResponse>> markInvoiceAsSent(@PathVariable UUID invoiceId) {
        log.info("Marking invoice as sent: {}", invoiceId);
        invoiceService.markInvoiceAsSent(invoiceId);
        Invoice invoice = invoiceService.getInvoice(invoiceId);
        InvoiceResponse response = InvoiceResponse.from(invoice);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
    
    /**
     * Mark invoice as paid (manual marking for Phase 9).
     */
    @PostMapping("/{invoiceId}/mark-paid")
    public ResponseEntity<ApiResponse<InvoiceResponse>> markInvoiceAsPaid(
            @PathVariable UUID invoiceId,
            @RequestBody(required = false) MarkPaidRequest request) {
        log.info("Marking invoice as paid: {}", invoiceId);
        
        Instant paidAt = request != null && request.getPaidAt() != null 
            ? request.getPaidAt() 
            : Instant.now();
        
        invoiceService.markInvoiceAsPaid(invoiceId, paidAt);
        Invoice invoice = invoiceService.getInvoice(invoiceId);
        InvoiceResponse response = InvoiceResponse.from(invoice);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
    
    // Inner class for request body
    public static class MarkPaidRequest {
        private Instant paidAt;
        
        public Instant getPaidAt() {
            return paidAt;
        }
        
        public void setPaidAt(Instant paidAt) {
            this.paidAt = paidAt;
        }
    }
}
