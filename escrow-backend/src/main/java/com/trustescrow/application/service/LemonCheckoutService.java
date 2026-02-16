package com.trustescrow.application.service;

import com.trustescrow.domain.model.Invoice;
import com.trustescrow.domain.model.LemonProductMapping;
import com.trustescrow.domain.model.Partner;
import com.trustescrow.domain.service.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * Lemon Checkout Service for Phase 10.
 * Generates Lemon Squeezy checkout links for invoices.
 * 
 * CRITICAL: Only Lemon webhooks are trusted for payment confirmation.
 * Frontend callbacks are NOT trusted.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class LemonCheckoutService {
    
    @Value("${lemon.api.key:}")
    private String lemonApiKey;
    
    @Value("${lemon.store.id:}")
    private String lemonStoreId;
    
    @Value("${lemon.checkout.base-url:https://app.lemonsqueezy.com/checkout/buy}")
    private String lemonCheckoutBaseUrl;
    
    @Value("${lemon.webhook.url:}")
    private String lemonWebhookUrl;
    
    private final InvoiceRepository invoiceRepository;
    private final PartnerRepository partnerRepository;
    private final LemonProductMappingRepository productMappingRepository;
    
    /**
     * Generate Lemon Checkout Link for an invoice.
     * 
     * @param invoiceId Invoice ID
     * @return Lemon Checkout URL
     */
    @Transactional
    public String generateCheckoutLink(UUID invoiceId) {
        log.info("Generating Lemon checkout link for invoice: {}", invoiceId);
        
        // Load invoice
        Invoice invoice = invoiceRepository.findById(invoiceId)
            .orElseThrow(() -> new IllegalArgumentException("Invoice not found: " + invoiceId));
        
        // Check if already has checkout URL
        if (invoice.getLemonCheckoutUrl() != null && !invoice.getLemonCheckoutUrl().isEmpty()) {
            log.info("Invoice already has checkout URL, returning existing");
            return invoice.getLemonCheckoutUrl();
        }
        
        // Load partner
        Partner partner = partnerRepository.findById(invoice.getPartnerId())
            .orElseThrow(() -> new IllegalArgumentException("Partner not found: " + invoice.getPartnerId()));
        
        // Determine product ID based on partner tier or invoice type
        String productId;
        String variantId = null;
        
        if (partner.getTier() != null) {
            // Subscription-based: use tier mapping
            LemonProductMapping mapping = productMappingRepository.findByPartnerTier(partner.getTier())
                .orElseThrow(() -> new IllegalStateException("No Lemon product mapping for tier: " + partner.getTier()));
            productId = mapping.getLemonProductId();
            variantId = mapping.getLemonVariantId();
        } else {
            // Per-deal: use one-time payment product
            // For Phase 10 MVP, use a default one-time product
            // In production, configure this per environment
            productId = getOneTimeProductId();
        }
        
        // Generate checkout URL
        // Lemon Squeezy checkout URL format:
        // https://app.lemonsqueezy.com/checkout/buy/{product_id}?checkout[custom][invoice_id]={invoice_id}&checkout[custom][partner_id]={partner_id}
        String checkoutUrl = buildCheckoutUrl(productId, variantId, invoice, partner);
        
        // Save checkout URL to invoice
        invoice.setLemonCheckoutUrl(checkoutUrl);
        invoiceRepository.save(invoice);
        
        log.info("Lemon checkout link generated for invoice: {}", invoiceId);
        return checkoutUrl;
    }
    
    /**
     * Generate Lemon Checkout Link for a deal/milestone.
     * 
     * @param dealId Deal ID
     * @param milestoneId Milestone ID (optional)
     * @return Lemon Checkout URL
     */
    @Transactional
    public String generateCheckoutLinkForDeal(UUID dealId, UUID milestoneId) {
        log.info("Generating Lemon checkout link for deal: {}, milestone: {}", dealId, milestoneId);
        
        // Get one-time product ID
        String productId = getOneTimeProductId();
        
        // Build checkout URL with dealId and milestoneId in custom data
        StringBuilder url = new StringBuilder(lemonCheckoutBaseUrl);
        url.append("/").append(productId);
        
        // Add custom data (dealId, milestoneId) for webhook processing
        url.append("?checkout[custom][dealId]=").append(dealId);
        if (milestoneId != null) {
            url.append("&checkout[custom][milestoneId]=").append(milestoneId);
        }
        
        // Add success URL (webhook endpoint)
        if (lemonWebhookUrl != null && !lemonWebhookUrl.isEmpty()) {
            url.append("&checkout[redirect_url]=").append(lemonWebhookUrl);
        }
        
        log.info("Lemon checkout link generated for deal: {}", dealId);
        return url.toString();
    }
    
    /**
     * Build Lemon Checkout URL with custom data.
     */
    private String buildCheckoutUrl(String productId, String variantId, Invoice invoice, Partner partner) {
        StringBuilder url = new StringBuilder(lemonCheckoutBaseUrl);
        url.append("/").append(productId);
        
        // Add variant if specified
        if (variantId != null && !variantId.isEmpty()) {
            url.append("/").append(variantId);
        }
        
        // Add custom data (invoice_id, partner_id) for webhook processing
        url.append("?checkout[custom][invoice_id]=").append(invoice.getId());
        url.append("&checkout[custom][partner_id]=").append(partner.getId());
        
        // Add customer email
        url.append("&checkout[email]=").append(partner.getContactEmail());
        
        // Add custom price (if invoice amount differs from product price)
        // Note: Lemon may require API call for custom pricing
        // For Phase 10 MVP, assume product price matches invoice amount
        
        // Add success URL (webhook endpoint)
        if (lemonWebhookUrl != null && !lemonWebhookUrl.isEmpty()) {
            url.append("&checkout[redirect_url]=").append(lemonWebhookUrl);
        }
        
        return url.toString();
    }
    
    /**
     * Get one-time payment product ID.
     * For Phase 10 MVP, this is a placeholder.
     * In production, configure this per environment.
     */
    private String getOneTimeProductId() {
        // Phase 10 MVP: Return configured value or default
        // In production, this should come from configuration
        return "one-time-product-id"; // TODO: Configure in application.yml
    }
}
