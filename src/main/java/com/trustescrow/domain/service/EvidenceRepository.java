package com.trustescrow.domain.service;

import com.trustescrow.domain.model.EvidenceMetadata;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface EvidenceRepository extends JpaRepository<EvidenceMetadata, UUID> {
    
    List<EvidenceMetadata> findByDealId(UUID dealId);
}
