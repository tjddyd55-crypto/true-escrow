package com.trustescrow.domain.service;

import com.trustescrow.domain.model.DealMilestone;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface DealMilestoneRepository extends JpaRepository<DealMilestone, UUID> {
    
    List<DealMilestone> findByDealIdOrderByOrderIndexAsc(UUID dealId);
    
    long countByDealId(UUID dealId);
}
