package com.trustescrow.presentation.controller;

import com.trustescrow.application.dto.*;
import com.trustescrow.application.service.EntitlementService;
import com.trustescrow.application.service.InvoiceService;
import com.trustescrow.application.service.PartnerOnboardingService;
import com.trustescrow.application.service.PartnerDashboardService;
import com.trustescrow.domain.model.Partner;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Partner Controller for Phase 9.
 * Handles partner onboarding and dashboard access.
 */
@RestController
@RequestMapping("/api/partners")
@RequiredArgsConstructor
@Slf4j
public class PartnerController {
    
    private final PartnerOnboardingService partnerOnboardingService;
    private final PartnerDashboardService partnerDashboardService;
    private final InvoiceService invoiceService;
    private final EntitlementService entitlementService;
    
    /**
     * Create a new partner.
     */
    @PostMapping
    public ResponseEntity<ApiResponse<PartnerResponse>> createPartner(@RequestBody CreatePartnerRequest request) {
        log.info("Creating partner: {}", request.getName());
        
        Partner partner = partnerOnboardingService.createPartner(
            request.getName(),
            request.getContactEmail(),
            request.getPricingModel(),
            request.getTier()
        );
        
        PartnerResponse response = PartnerResponse.from(partner);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
    
    /**
     * Get partner by ID.
     */
    @GetMapping("/{partnerId}")
    public ResponseEntity<ApiResponse<PartnerResponse>> getPartner(@PathVariable UUID partnerId) {
        Partner partner = partnerOnboardingService.getPartner(partnerId);
        PartnerResponse response = PartnerResponse.from(partner);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
    
    /**
     * Bind pricing model to partner.
     */
    @PutMapping("/{partnerId}/pricing")
    public ResponseEntity<ApiResponse<PartnerResponse>> bindPricingModel(
            @PathVariable UUID partnerId,
            @RequestBody BindPricingRequest request) {
        log.info("Binding pricing model to partner: {}", partnerId);
        
        Partner partner = partnerOnboardingService.bindPricingModel(
            partnerId,
            request.getPricingModel(),
            request.getTier()
        );
        
        PartnerResponse response = PartnerResponse.from(partner);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
    
    /**
     * Record contract agreement.
     */
    @PostMapping("/{partnerId}/contract/agree")
    public ResponseEntity<ApiResponse<PartnerResponse>> recordContractAgreement(@PathVariable UUID partnerId) {
        log.info("Recording contract agreement for partner: {}", partnerId);
        
        Partner partner = partnerOnboardingService.recordContractAgreement(partnerId);
        PartnerResponse response = PartnerResponse.from(partner);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
    
    /**
     * Get dashboard overview (requires partner token and active entitlement).
     */
    @GetMapping("/{partnerId}/dashboard/overview")
    public ResponseEntity<ApiResponse<DashboardOverviewResponse>> getDashboardOverview(
            @PathVariable UUID partnerId,
            @RequestHeader(value = "X-Partner-Token", required = false) String token) {
        
        // Validate token (simple check for Phase 9)
        validateToken(partnerId, token);
        
        // Check entitlement (Phase 10)
        if (!entitlementService.hasActiveEntitlement(partnerId)) {
            return ResponseEntity.status(403).body(
                ApiResponse.error("No active entitlement. Please complete payment.")
            );
        }
        
        DashboardOverviewResponse overview = partnerDashboardService.getOverview(partnerId);
        return ResponseEntity.ok(ApiResponse.success(overview));
    }
    
    /**
     * Get partner deals (read-only).
     */
    @GetMapping("/{partnerId}/deals")
    public ResponseEntity<ApiResponse<List<DealResponse>>> getPartnerDeals(
            @PathVariable UUID partnerId,
            @RequestHeader(value = "X-Partner-Token", required = false) String token,
            @RequestParam(required = false) String status) {
        
        validateToken(partnerId, token);
        
        // Check entitlement (Phase 10)
        if (!entitlementService.hasActiveEntitlement(partnerId)) {
            return ResponseEntity.status(403).body(
                ApiResponse.error("No active entitlement. Please complete payment.")
            );
        }
        
        List<DealResponse> deals = partnerDashboardService.getPartnerDeals(partnerId, status);
        return ResponseEntity.ok(ApiResponse.success(deals));
    }
    
    /**
     * Get revenue summary.
     */
    @GetMapping("/{partnerId}/revenue/summary")
    public ResponseEntity<ApiResponse<RevenueSummaryResponse>> getRevenueSummary(
            @PathVariable UUID partnerId,
            @RequestHeader(value = "X-Partner-Token", required = false) String token) {
        
        validateToken(partnerId, token);
        
        // Check entitlement (Phase 10)
        if (!entitlementService.hasActiveEntitlement(partnerId)) {
            return ResponseEntity.status(403).body(
                ApiResponse.error("No active entitlement. Please complete payment.")
            );
        }
        
        RevenueSummaryResponse summary = partnerDashboardService.getRevenueSummary(partnerId);
        return ResponseEntity.ok(ApiResponse.success(summary));
    }
    
    /**
     * Get partner invoices.
     */
    @GetMapping("/{partnerId}/invoices")
    public ResponseEntity<ApiResponse<List<InvoiceResponse>>> getPartnerInvoices(
            @PathVariable UUID partnerId,
            @RequestHeader(value = "X-Partner-Token", required = false) String token) {
        
        validateToken(partnerId, token);
        
        // Check entitlement (Phase 10) - Allow access to invoices even without active entitlement
        // This allows partners to view and pay invoices
        
        List<InvoiceResponse> invoices = partnerDashboardService.getPartnerInvoices(partnerId);
        return ResponseEntity.ok(ApiResponse.success(invoices));
    }
    
    /**
     * Simple token validation for Phase 9.
     * In production, use proper authentication.
     */
    private void validateToken(UUID partnerId, String token) {
        if (token == null) {
            throw new IllegalArgumentException("Missing X-Partner-Token header");
        }
        
        Partner partner = partnerOnboardingService.getPartner(partnerId);
        if (!partner.getDashboardToken().equals(token)) {
            throw new IllegalArgumentException("Invalid dashboard token");
        }
    }
}
