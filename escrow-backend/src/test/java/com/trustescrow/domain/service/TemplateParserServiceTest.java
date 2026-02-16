package com.trustescrow.domain.service;

import com.trustescrow.domain.service.TemplateParserService.MonetaryPolicy;
import com.trustescrow.domain.service.TemplateParserService.TimerConfiguration;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.time.Duration;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
class TemplateParserServiceTest {
    
    @Autowired
    private TemplateParserService templateParserService;
    
    @Autowired
    private CategoryTemplateService categoryTemplateService;
    
    @Test
    void testParseMonetaryPolicy() {
        // Create a template and parse it
        var template = categoryTemplateService.createDefaultTemplate(
            com.trustescrow.domain.model.DealCategory.REAL_ESTATE_SALE
        );
        
        MonetaryPolicy policy = templateParserService.extractMonetaryPolicy(template.getTemplateJson());
        
        assertNotNull(policy);
        assertEquals(25, policy.getHoldbackPercent()); // Real estate: 20-30%
        assertEquals(75, policy.getImmediatePercent()); // 100 - holdback
    }
    
    @Test
    void testParseTimerConfiguration() {
        var template = categoryTemplateService.createDefaultTemplate(
            com.trustescrow.domain.model.DealCategory.USED_CAR_PRIVATE
        );
        
        TimerConfiguration config = templateParserService.extractTimerConfiguration(template.getTemplateJson());
        
        assertNotNull(config);
        assertEquals(Duration.ofDays(3), config.getAutoApproveDuration()); // Used car: 2-3 days
        assertTrue(config.isAutoApproveEnabled());
    }
    
    @Test
    void testEvidenceRequiredDefault() {
        var template = categoryTemplateService.createDefaultTemplate(
            com.trustescrow.domain.model.DealCategory.REAL_ESTATE_SALE
        );
        
        boolean required = templateParserService.isEvidenceRequiredForIssue(template.getTemplateJson());
        
        assertTrue(required); // Default: required
    }
}
