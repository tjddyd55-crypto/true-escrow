package com.trustescrow.application.service;

import com.trustescrow.domain.model.ContractTemplate;
import com.trustescrow.domain.model.DealCategory;
import com.trustescrow.domain.service.CategoryTemplateService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

/**
 * Initializes default templates for all categories on application startup.
 * Phase 4: Creates category-specific templates with proper parameters.
 * 
 * This is optional - templates can also be created via API.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class CategoryTemplateInitializationService implements CommandLineRunner {
    
    private final CategoryTemplateService categoryTemplateService;
    
    @Override
    public void run(String... args) {
        log.info("Initializing default templates for Phase 4 categories...");
        
        // Initialize templates for Phase 4 categories
        try {
            ContractTemplate reSale = categoryTemplateService.createDefaultTemplate(DealCategory.REAL_ESTATE_SALE);
            log.info("Created default template for REAL_ESTATE_SALE: version {}", reSale.getVersion());
            
            ContractTemplate reRental = categoryTemplateService.createDefaultTemplate(DealCategory.REAL_ESTATE_RENTAL);
            log.info("Created default template for REAL_ESTATE_RENTAL: version {}", reRental.getVersion());
            
            ContractTemplate ucPrivate = categoryTemplateService.createDefaultTemplate(DealCategory.USED_CAR_PRIVATE);
            log.info("Created default template for USED_CAR_PRIVATE: version {}", ucPrivate.getVersion());
            
            ContractTemplate ucDealer = categoryTemplateService.createDefaultTemplate(DealCategory.USED_CAR_DEALER);
            log.info("Created default template for USED_CAR_DEALER: version {}", ucDealer.getVersion());
            
            log.info("Phase 4 category templates initialized successfully");
        } catch (Exception e) {
            log.warn("Failed to initialize some templates (may already exist): {}", e.getMessage());
        }
    }
}
