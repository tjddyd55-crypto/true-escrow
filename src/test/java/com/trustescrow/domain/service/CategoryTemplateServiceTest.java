package com.trustescrow.domain.service;

import com.trustescrow.domain.model.ContractTemplate;
import com.trustescrow.domain.model.DealCategory;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class CategoryTemplateServiceTest {
    
    @Autowired
    private CategoryTemplateService categoryTemplateService;
    
    @Test
    void testCreateRealEstateSaleTemplate() {
        ContractTemplate template = categoryTemplateService.createDefaultTemplate(DealCategory.REAL_ESTATE_SALE);
        
        assertNotNull(template);
        assertEquals(DealCategory.REAL_ESTATE_SALE, template.getCategory());
        assertNotNull(template.getTemplateJson());
        assertTrue(template.getTemplateJson().contains("REAL_ESTATE_SALE"));
    }
    
    @Test
    void testCreateUsedCarPrivateTemplate() {
        ContractTemplate template = categoryTemplateService.createDefaultTemplate(DealCategory.USED_CAR_PRIVATE);
        
        assertNotNull(template);
        assertEquals(DealCategory.USED_CAR_PRIVATE, template.getCategory());
        assertNotNull(template.getTemplateJson());
    }
    
    @Test
    void testTemplateJsonContainsMonetaryPolicy() {
        ContractTemplate template = categoryTemplateService.createDefaultTemplate(DealCategory.REAL_ESTATE_SALE);
        
        assertTrue(template.getTemplateJson().contains("monetaryPolicy"));
        assertTrue(template.getTemplateJson().contains("holdbackPercent"));
        assertTrue(template.getTemplateJson().contains("immediatePercent"));
    }
    
    @Test
    void testTemplateJsonContainsTimerConfiguration() {
        ContractTemplate template = categoryTemplateService.createDefaultTemplate(DealCategory.USED_CAR_PRIVATE);
        
        assertTrue(template.getTemplateJson().contains("timers"));
        assertTrue(template.getTemplateJson().contains("AUTO_APPROVE"));
        assertTrue(template.getTemplateJson().contains("durationDays"));
    }
}
