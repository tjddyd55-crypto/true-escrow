package com.trustescrow.application.service;

import com.trustescrow.domain.model.Partner;
import com.trustescrow.domain.service.PartnerRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

/**
 * Partner Onboarding Service for Phase 9.
 * Handles partner creation, pricing binding, and contract agreement.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PartnerOnboardingService {
    
    private final PartnerRepository partnerRepository;
    
    /**
     * Create a new partner.
     */
    @Transactional
    public Partner createPartner(String name, String contactEmail, 
                                 Partner.PricingModel pricingModel, 
                                 Partner.SubscriptionTier tier) {
        log.info("Creating partner: {}", name);
        
        // Generate dashboard token (simple UUID for Phase 9)
        String dashboardToken = UUID.randomUUID().toString();
        
        Partner partner = Partner.builder()
            .name(name)
            .contactEmail(contactEmail)
            .pricingModel(pricingModel)
            .tier(tier)
            .contractAgreedAt(null) // Not agreed yet
            .dashboardToken(dashboardToken)
            .createdAt(Instant.now())
            .updatedAt(Instant.now())
            .build();
        
        partner = partnerRepository.save(partner);
        log.info("Partner created: {} (ID: {})", name, partner.getId());
        
        return partner;
    }
    
    /**
     * Bind pricing model to partner.
     */
    @Transactional
    public Partner bindPricingModel(UUID partnerId, 
                                     Partner.PricingModel pricingModel, 
                                     Partner.SubscriptionTier tier) {
        log.info("Binding pricing model to partner: {}", partnerId);
        
        Partner partner = partnerRepository.findById(partnerId)
            .orElseThrow(() -> new IllegalArgumentException("Partner not found: " + partnerId));
        
        partner.updatePricingModel(pricingModel, tier);
        partner = partnerRepository.save(partner);
        
        log.info("Pricing model bound to partner: {}", partnerId);
        return partner;
    }
    
    /**
     * Record contract agreement.
     */
    @Transactional
    public Partner recordContractAgreement(UUID partnerId) {
        log.info("Recording contract agreement for partner: {}", partnerId);
        
        Partner partner = partnerRepository.findById(partnerId)
            .orElseThrow(() -> new IllegalArgumentException("Partner not found: " + partnerId));
        
        partner.recordContractAgreement();
        partner = partnerRepository.save(partner);
        
        log.info("Contract agreement recorded for partner: {}", partnerId);
        return partner;
    }
    
    /**
     * Get partner by ID.
     */
    public Partner getPartner(UUID partnerId) {
        return partnerRepository.findById(partnerId)
            .orElseThrow(() -> new IllegalArgumentException("Partner not found: " + partnerId));
    }
    
    /**
     * Get partner by dashboard token (for authentication).
     */
    public Partner getPartnerByToken(String token) {
        return partnerRepository.findByDashboardToken(token)
            .orElseThrow(() -> new IllegalArgumentException("Invalid dashboard token"));
    }
}
