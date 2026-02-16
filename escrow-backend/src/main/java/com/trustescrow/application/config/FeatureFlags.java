package com.trustescrow.application.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.util.List;

/**
 * Feature flags for pilot control.
 * Allows enabling/disabling pilot without code changes or DB edits.
 * 
 * Phase 6: Safe toggles for MN × USED_CAR_PRIVATE pilot.
 */
@Configuration
@ConfigurationProperties(prefix = "pilot")
@Getter
@Setter
public class FeatureFlags {
    
    /**
     * Master flag: Enable/disable pilot deal creation.
     * When false: Disallow creating new pilot-category deals.
     * Existing deals continue normally.
     */
    private boolean enabled = false;
    
    /**
     * Country allowlist for pilot.
     * Only deals in these countries can be created when pilot is enabled.
     * Example: ["MN"]
     */
    private List<String> countryAllowlist = List.of();
    
    /**
     * Category allowlist for pilot.
     * Only deals in these categories can be created when pilot is enabled.
     * Example: ["USED_CAR_PRIVATE"]
     */
    private List<String> categoryAllowlist = List.of();
    
    /**
     * Template version to use for new pilot deals.
     * Example: "v1" or "v2"
     * New deals pick this version; existing deals keep pinned version.
     */
    private String templateVersion = "v1";
    
    /**
     * Checks if a country is allowed for pilot.
     */
    public boolean isCountryAllowed(String country) {
        if (!enabled) {
            return false;
        }
        return countryAllowlist.contains(country);
    }
    
    /**
     * Checks if a category is allowed for pilot.
     */
    public boolean isCategoryAllowed(String category) {
        if (!enabled) {
            return false;
        }
        return categoryAllowlist.contains(category);
    }
    
    /**
     * Checks if a deal (country × category) is allowed for pilot.
     */
    public boolean isDealAllowed(String country, String category) {
        return isCountryAllowed(country) && isCategoryAllowed(category);
    }
}
