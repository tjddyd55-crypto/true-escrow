package com.trustescrow.application.service;

import com.trustescrow.domain.model.Entitlement;
import com.trustescrow.domain.model.Invoice;
import com.trustescrow.domain.model.Partner;
import com.trustescrow.domain.service.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Entitlement Service for Phase 10.
 * Manages partner entitlements based on payment/subscription.
 * 
 * CRITICAL: Entitlement is granted only after payment is confirmed.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EntitlementService {
    
    private final EntitlementRepository entitlementRepository;
    private final InvoiceRepository invoiceRepository;
    private final PartnerRepository partnerRepository;
    
    /**
     * Grant entitlement for a paid invoice.
     * 
     * @param invoiceId Invoice ID
     * @return Created/updated entitlement
     */
    @Transactional
    public Entitlement grantEntitlementForInvoice(UUID invoiceId) {
        log.info("Granting entitlement for invoice: {}", invoiceId);
        
        // Load invoice
        Invoice invoice = invoiceRepository.findById(invoiceId)
            .orElseThrow(() -> new IllegalArgumentException("Invoice not found: " + invoiceId));
        
        // Verify invoice is PAID
        if (invoice.getStatus() != Invoice.InvoiceStatus.PAID) {
            throw new IllegalStateException("Invoice is not PAID: " + invoiceId);
        }
        
        // Check if entitlement already exists (idempotency)
        Entitlement existing = entitlementRepository.findByInvoiceId(invoiceId).orElse(null);
        if (existing != null) {
            log.info("Entitlement already exists for invoice: {}", invoiceId);
            return existing;
        }
        
        // Load partner
        Partner partner = partnerRepository.findById(invoice.getPartnerId())
            .orElseThrow(() -> new IllegalArgumentException("Partner not found: " + invoice.getPartnerId()));
        
        // Calculate entitlement period
        // For monthly invoices: 30 days from payment date
        // For subscription: until next billing date
        Instant startDate = invoice.getPaidAt() != null ? invoice.getPaidAt() : Instant.now();
        Instant endDate = calculateEndDate(invoice, partner, startDate);
        
        // Create entitlement
        Entitlement entitlement = Entitlement.builder()
            .partnerId(partner.getId())
            .type(Entitlement.EntitlementType.INVOICE_BASED)
            .status(Entitlement.EntitlementStatus.ACTIVE)
            .startDate(startDate)
            .endDate(endDate)
            .invoiceId(invoiceId)
            .lemonSubscriptionId(null) // For invoice-based, no subscription
            .createdAt(Instant.now())
            .updatedAt(Instant.now())
            .build();
        
        entitlement = entitlementRepository.save(entitlement);
        log.info("Entitlement granted: {}", entitlement.getId());
        
        return entitlement;
    }
    
    /**
     * Calculate entitlement end date based on invoice and partner.
     */
    private Instant calculateEndDate(Invoice invoice, Partner partner, Instant startDate) {
        // For Phase 10 MVP: 30 days from payment date
        // In production, this could be:
        // - Monthly invoices: 30 days
        // - Annual invoices: 365 days
        // - Subscription: until next billing date
        
        if (partner.getPricingModel() == Partner.PricingModel.SUBSCRIPTION ||
            partner.getPricingModel() == Partner.PricingModel.HYBRID) {
            // Subscription: extend to next billing cycle
            return startDate.plus(30, ChronoUnit.DAYS);
        } else {
            // Per-deal: 30 days from payment
            return startDate.plus(30, ChronoUnit.DAYS);
        }
    }
    
    /**
     * Check if partner has active entitlement.
     * 
     * @param partnerId Partner ID
     * @return true if partner has active entitlement
     */
    @Transactional(readOnly = true)
    public boolean hasActiveEntitlement(UUID partnerId) {
        Optional<Entitlement> entitlement = entitlementRepository.findActiveEntitlementForPartner(
            partnerId, Instant.now());
        return entitlement.isPresent() && entitlement.get().isActive();
    }
    
    /**
     * Get active entitlement for partner.
     * 
     * @param partnerId Partner ID
     * @return Active entitlement or null
     */
    @Transactional(readOnly = true)
    public Entitlement getActiveEntitlement(UUID partnerId) {
        return entitlementRepository.findActiveEntitlementForPartner(partnerId, Instant.now())
            .orElse(null);
    }
    
    /**
     * Expire entitlements that have passed their end date.
     * Runs daily.
     */
    @Scheduled(cron = "0 0 0 * * ?") // Daily at midnight
    @Transactional
    public void expireEntitlements() {
        log.info("Checking for expiring entitlements");
        
        List<Entitlement> expiring = entitlementRepository.findExpiringEntitlements(Instant.now());
        
        for (Entitlement entitlement : expiring) {
            log.info("Expiring entitlement: {}", entitlement.getId());
            entitlement.expire();
            entitlementRepository.save(entitlement);
        }
        
        log.info("Expired {} entitlements", expiring.size());
    }
    
    /**
     * Renew entitlement for a paid invoice.
     * Extends existing entitlement or creates new one.
     */
    @Transactional
    public Entitlement renewEntitlementForInvoice(UUID invoiceId) {
        log.info("Renewing entitlement for invoice: {}", invoiceId);
        
        // Load invoice
        Invoice invoice = invoiceRepository.findById(invoiceId)
            .orElseThrow(() -> new IllegalArgumentException("Invoice not found: " + invoiceId));
        
        // Find existing entitlement for this partner
        Entitlement existing = entitlementRepository.findActiveEntitlementForPartner(
            invoice.getPartnerId(), Instant.now()).orElse(null);
        
        if (existing != null) {
            // Extend existing entitlement
            Instant newEndDate = calculateEndDate(invoice, 
                partnerRepository.findById(invoice.getPartnerId()).orElseThrow(), 
                Instant.now());
            existing.extend(newEndDate);
            existing = entitlementRepository.save(existing);
            log.info("Entitlement extended: {}", existing.getId());
            return existing;
        } else {
            // Create new entitlement
            return grantEntitlementForInvoice(invoiceId);
        }
    }
}
