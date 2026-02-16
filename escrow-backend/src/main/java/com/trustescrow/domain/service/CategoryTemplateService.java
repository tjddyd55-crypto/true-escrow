package com.trustescrow.domain.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.trustescrow.domain.model.ContractTemplate;
import com.trustescrow.domain.model.DealCategory;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

/**
 * Service for creating category-specific contract templates.
 * Templates are parameterized by category but use the same core lifecycle.
 * 
 * Phase 4: Domain scenario expansion without changing core engine.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CategoryTemplateService {
    
    private final ContractTemplateService contractTemplateService;
    private final ObjectMapper objectMapper;
    
    /**
     * Creates a default template for a category with category-specific parameters.
     * Parameters vary by category but lifecycle remains the same.
     */
    @Transactional
    public ContractTemplate createDefaultTemplate(DealCategory category) {
        TemplateParameters params = getDefaultParameters(category);
        String templateJson = buildTemplateJson(category, params);
        
        return contractTemplateService.createTemplate(category, templateJson);
    }
    
    /**
     * Gets default parameters for a category based on SHARED_RULES.
     */
    private TemplateParameters getDefaultParameters(DealCategory category) {
        return switch (category) {
            case REAL_ESTATE_SALE, REAL_ESTATE_RENTAL -> TemplateParameters.builder()
                .inspectionTTLDays(7) // 5-7 days
                .holdbackPercent(25) // 20-30%
                .immediatePercent(75) // 100 - holdback
                .autoApproveEnabled(true)
                .evidenceRequired(true)
                .build();
            
            case USED_CAR_PRIVATE, USED_CAR_DEALER -> TemplateParameters.builder()
                .inspectionTTLDays(3) // 2-3 days
                .holdbackPercent(15) // 10-20%
                .immediatePercent(85) // 100 - holdback
                .autoApproveEnabled(true)
                .evidenceRequired(true)
                .build();
            
            default -> TemplateParameters.builder()
                .inspectionTTLDays(7)
                .holdbackPercent(30)
                .immediatePercent(70)
                .autoApproveEnabled(true)
                .evidenceRequired(true)
                .build();
        };
    }
    
    /**
     * Builds template JSON with category-specific parameters.
     * Structure matches Rules Engine expectations.
     */
    private String buildTemplateJson(DealCategory category, TemplateParameters params) {
        try {
            ObjectNode root = objectMapper.createObjectNode();
            
            // Monetary policy
            ObjectNode monetaryPolicy = objectMapper.createObjectNode();
            monetaryPolicy.put("immediatePercent", params.getImmediatePercent());
            monetaryPolicy.put("holdbackPercent", params.getHoldbackPercent());
            monetaryPolicy.put("holdbackReleaseCondition", "approved OR auto-approve");
            root.set("monetaryPolicy", monetaryPolicy);
            
            // Issue policy
            ObjectNode issuePolicy = objectMapper.createObjectNode();
            issuePolicy.put("evidenceRequired", params.isEvidenceRequired());
            issuePolicy.put("defaultResolutionOnDisputeTTL", "releaseHoldbackMinusMinorCap");
            
            // Allowed reason codes (all standard codes)
            root.putArray("allowedReasonCodes")
                .add("NOT_DELIVERED")
                .add("DAMAGE_MAJOR")
                .add("DAMAGE_MINOR")
                .add("MISSING_PARTS")
                .add("QUALITY_NOT_MATCHING")
                .add("DOCUMENT_MISMATCH")
                .add("OTHER");
            
            // Offset caps by reason code (category-specific)
            ObjectNode offsetCaps = objectMapper.createObjectNode();
            if (category == DealCategory.REAL_ESTATE_SALE || category == DealCategory.REAL_ESTATE_RENTAL) {
                // Real estate: higher caps for major issues
                offsetCaps.put("DAMAGE_MINOR", params.getHoldbackPercent() * 0.1); // 10% of holdback
                offsetCaps.put("DAMAGE_MAJOR", params.getHoldbackPercent() * 0.5); // 50% of holdback
            } else if (category == DealCategory.USED_CAR_PRIVATE || category == DealCategory.USED_CAR_DEALER) {
                // Used car: lower caps
                offsetCaps.put("DAMAGE_MINOR", params.getHoldbackPercent() * 0.05); // 5% of holdback
                offsetCaps.put("DAMAGE_MAJOR", params.getHoldbackPercent() * 0.3); // 30% of holdback
            }
            issuePolicy.set("offsetCapsByReasonCode", offsetCaps);
            root.set("issuePolicy", issuePolicy);
            
            // Timer configuration
            ObjectNode timers = objectMapper.createObjectNode();
            ObjectNode autoApprove = objectMapper.createObjectNode();
            autoApprove.put("enabled", params.isAutoApproveEnabled());
            autoApprove.put("durationDays", params.getInspectionTTLDays());
            timers.set("AUTO_APPROVE", autoApprove);
            
            ObjectNode disputeTTL = objectMapper.createObjectNode();
            disputeTTL.put("durationDays", 14); // Standard 14 days for disputes
            timers.set("DISPUTE_TTL", disputeTTL);
            root.set("timers", timers);
            
            // Milestones (empty for now, can be extended per category)
            root.putArray("milestones");
            
            // Category metadata
            root.put("category", category.name());
            root.put("version", 1);
            
            return objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(root);
        } catch (Exception e) {
            log.error("Failed to build template JSON for category: {}", category, e);
            throw new IllegalStateException("Failed to build template JSON", e);
        }
    }
    
    @lombok.Value
    @lombok.Builder
    private static class TemplateParameters {
        int inspectionTTLDays;
        int holdbackPercent;
        int immediatePercent;
        boolean autoApproveEnabled;
        boolean evidenceRequired;
    }
}
