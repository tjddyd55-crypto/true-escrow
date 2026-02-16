package com.trustescrow.domain.service;

import com.trustescrow.domain.model.DealCategory;
import com.trustescrow.domain.model.EvidenceType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Set;

/**
 * Service for managing category-specific evidence requirements.
 * Based on SHARED_RULES/REQUIRED_EVIDENCE_BY_CATEGORY.md
 * 
 * Phase 4: Evidence requirements vary by category but enforcement logic remains the same.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CategoryEvidenceService {
    
    /**
     * Gets default evidence types required for a category.
     * These are defaults; contract template can override.
     */
    public List<EvidenceRequirement> getDefaultEvidenceRequirements(DealCategory category) {
        return switch (category) {
            case REAL_ESTATE_SALE, REAL_ESTATE_RENTAL -> List.of(
                EvidenceRequirement.builder()
                    .type(EvidenceType.REPORT)
                    .description("Contract document (PDF)")
                    .required(true)
                    .build(),
                EvidenceRequirement.builder()
                    .type(EvidenceType.PHOTO)
                    .description("Property photos")
                    .required(true)
                    .build(),
                EvidenceRequirement.builder()
                    .type(EvidenceType.REPORT)
                    .description("Inspection report")
                    .required(false) // Optional
                    .build()
            );
            
            case USED_CAR_PRIVATE, USED_CAR_DEALER -> List.of(
                EvidenceRequirement.builder()
                    .type(EvidenceType.PHOTO)
                    .description("Vehicle exterior photos")
                    .required(true)
                    .build(),
                EvidenceRequirement.builder()
                    .type(EvidenceType.PHOTO)
                    .description("Interior photos")
                    .required(true)
                    .build(),
                EvidenceRequirement.builder()
                    .type(EvidenceType.PHOTO)
                    .description("Odometer photo")
                    .required(true)
                    .build(),
                EvidenceRequirement.builder()
                    .type(EvidenceType.REPORT)
                    .description("Inspection report")
                    .required(false) // Optional
                    .build(),
                EvidenceRequirement.builder()
                    .type(EvidenceType.REPORT)
                    .description("Ownership/registration document")
                    .required(false) // Optional, per country
                    .build()
            );
            
            default -> List.of(
                EvidenceRequirement.builder()
                    .type(EvidenceType.PHOTO)
                    .description("General evidence")
                    .required(true)
                    .build()
            );
        };
    }
    
    /**
     * Checks if evidence is required for issue creation for a category.
     * Default: true (required) unless template explicitly waives.
     */
    public boolean isEvidenceRequiredForIssue(DealCategory category) {
        // Default: evidence required for all categories
        // Template can override this
        return true;
    }
    
    @lombok.Value
    @lombok.Builder
    public static class EvidenceRequirement {
        EvidenceType type;
        String description;
        boolean required;
    }
}
