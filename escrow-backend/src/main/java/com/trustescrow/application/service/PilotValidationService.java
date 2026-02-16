package com.trustescrow.application.service;

import com.trustescrow.application.config.FeatureFlags;
import com.trustescrow.domain.model.DealCategory;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * Service for validating pilot deal creation.
 * Enforces feature flags at backend entry point.
 * 
 * Phase 6: Backend is source of truth; UI can hide paths but backend enforces.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PilotValidationService {
    
    private final FeatureFlags featureFlags;
    
    /**
     * Validates if a deal can be created for pilot.
     * 
     * @param country Country code (e.g., "MN")
     * @param category Deal category
     * @throws IllegalArgumentException if pilot is disabled or country/category not allowed
     */
    public void validatePilotDealCreation(String country, DealCategory category) {
        if (!featureFlags.isEnabled()) {
            throw new IllegalArgumentException(
                "Pilot is currently disabled. New pilot deals cannot be created. " +
                "Existing deals will continue normally."
            );
        }
        
        if (!featureFlags.isCountryAllowed(country)) {
            throw new IllegalArgumentException(
                String.format(
                    "Country '%s' is not in pilot allowlist. Allowed countries: %s",
                    country,
                    featureFlags.getCountryAllowlist()
                )
            );
        }
        
        if (!featureFlags.isCategoryAllowed(category.name())) {
            throw new IllegalArgumentException(
                String.format(
                    "Category '%s' is not in pilot allowlist. Allowed categories: %s",
                    category,
                    featureFlags.getCategoryAllowlist()
                )
            );
        }
        
        log.info("Pilot deal creation validated: country={}, category={}", country, category);
    }
    
    /**
     * Gets the template version to use for new pilot deals.
     */
    public String getTemplateVersion() {
        return featureFlags.getTemplateVersion();
    }
}
