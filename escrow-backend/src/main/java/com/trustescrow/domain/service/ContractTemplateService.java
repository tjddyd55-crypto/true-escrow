package com.trustescrow.domain.service;

import com.trustescrow.domain.model.ContractInstance;
import com.trustescrow.domain.model.ContractTemplate;
import com.trustescrow.domain.model.DealCategory;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

/**
 * Service for managing Contract Templates and Instances.
 * Templates are versioned; Instances are immutable snapshots.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ContractTemplateService {
    
    private final ContractTemplateRepository templateRepository;
    private final ContractInstanceRepository instanceRepository;
    
    /**
     * Creates a new version of a contract template.
     */
    @Transactional
    public ContractTemplate createTemplate(DealCategory category, String templateJson) {
        // Find latest version
        Integer nextVersion = templateRepository.findLatestVersionByCategory(category)
            .map(v -> v + 1)
            .orElse(1);
        
        ContractTemplate template = ContractTemplate.builder()
            .category(category)
            .version(nextVersion)
            .templateJson(templateJson)
            .createdAt(Instant.now())
            .updatedAt(Instant.now())
            .build();
        
        return templateRepository.save(template);
    }
    
    /**
     * Gets the latest template for a category.
     */
    @Transactional(readOnly = true)
    public ContractTemplate getLatestTemplate(DealCategory category) {
        return templateRepository.findLatestByCategory(category)
            .orElseThrow(() -> new IllegalArgumentException("No template found for category: " + category));
    }
    
    /**
     * Creates an immutable snapshot (ContractInstance) for a deal.
     * This is called when a deal is created or funded.
     */
    @Transactional
    public ContractInstance createInstance(UUID dealId, UUID templateId, Integer templateVersion, String snapshotJson) {
        ContractInstance instance = ContractInstance.builder()
            .dealId(dealId)
            .templateId(templateId)
            .templateVersion(templateVersion)
            .snapshotJson(snapshotJson)
            .createdAt(Instant.now())
            .build();
        
        return instanceRepository.save(instance);
    }
    
    /**
     * Gets the contract instance for a deal.
     */
    @Transactional(readOnly = true)
    public ContractInstance getInstanceByDealId(UUID dealId) {
        return instanceRepository.findByDealId(dealId)
            .orElseThrow(() -> new IllegalArgumentException("No contract instance found for deal: " + dealId));
    }
}
