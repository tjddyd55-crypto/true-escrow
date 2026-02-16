package com.trustescrow.domain.service;

import com.trustescrow.domain.model.EvidenceMetadata;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface EvidenceRepository extends JpaRepository<EvidenceMetadata, UUID> {
    
    List<EvidenceMetadata> findByDealId(UUID dealId);
    
    // MASTER TASK: Find evidence by deal and milestone
    List<EvidenceMetadata> findByDealIdAndMilestoneIdOrderByCreatedAtDesc(UUID dealId, UUID milestoneId);
    
    // MASTER TASK: Find evidence by milestone
    List<EvidenceMetadata> findByMilestoneIdOrderByCreatedAtDesc(UUID milestoneId);
}
