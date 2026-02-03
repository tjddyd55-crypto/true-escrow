package com.trustescrow.domain.service;

import com.trustescrow.domain.model.MilestoneDispute;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * STEP 6: Repository for milestone disputes.
 */
public interface MilestoneDisputeRepository extends JpaRepository<MilestoneDispute, UUID> {
    
    /**
     * Find dispute by deal and milestone.
     */
    Optional<MilestoneDispute> findByDealIdAndMilestoneId(UUID dealId, UUID milestoneId);
    
    /**
     * Find all disputes for a deal.
     */
    List<MilestoneDispute> findByDealIdOrderByCreatedAtDesc(UUID dealId);
    
    /**
     * Find all open disputes (OPEN or REVIEWING status).
     */
    List<MilestoneDispute> findByStatusInOrderByCreatedAtAsc(
        List<MilestoneDispute.DisputeStatus> statuses
    );
    
    /**
     * Find disputes by status.
     */
    List<MilestoneDispute> findByStatusOrderByCreatedAtAsc(MilestoneDispute.DisputeStatus status);
}
