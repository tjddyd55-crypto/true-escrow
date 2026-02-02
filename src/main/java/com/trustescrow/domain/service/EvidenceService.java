package com.trustescrow.domain.service;

import com.trustescrow.domain.model.EvidenceMetadata;
import com.trustescrow.domain.model.EvidenceType;
import com.trustescrow.domain.model.IssueReasonCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Service for managing evidence metadata.
 * Evidence is required for ISSUE creation unless template explicitly waives it.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EvidenceService {
    
    private final EvidenceRepository evidenceRepository;
    
    /**
     * Creates evidence metadata for a deal.
     */
    @Transactional
    public EvidenceMetadata createEvidence(
        UUID dealId,
        UUID uploadedBy,
        EvidenceType type,
        String uri
    ) {
        EvidenceMetadata evidence = EvidenceMetadata.builder()
            .dealId(dealId)
            .uploadedBy(uploadedBy)
            .type(type)
            .uri(uri)
            .createdAt(Instant.now())
            .build();
        
        return evidenceRepository.save(evidence);
    }
    
    /**
     * Validates that evidence is provided for an issue.
     * Returns true if evidence is required and provided, or if evidence is not required.
     */
    @Transactional(readOnly = true)
    public boolean validateEvidenceForIssue(UUID dealId, IssueReasonCode reasonCode, boolean evidenceRequiredByTemplate) {
        // If template explicitly waives evidence requirement, skip validation
        if (!evidenceRequiredByTemplate) {
            return true;
        }
        
        // Check if evidence exists for this deal
        List<EvidenceMetadata> evidence = evidenceRepository.findByDealId(dealId);
        return !evidence.isEmpty();
    }
    
    /**
     * Gets all evidence for a deal.
     */
    @Transactional(readOnly = true)
    public List<EvidenceMetadata> getEvidenceByDealId(UUID dealId) {
        return evidenceRepository.findByDealId(dealId);
    }
}
