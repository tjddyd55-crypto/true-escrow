package com.trustescrow.application.service;

import com.trustescrow.domain.model.DealMilestone;
import com.trustescrow.domain.service.DealMilestoneRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Service for managing deal milestones.
 * Maximum 3 milestones per deal.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class MilestoneService {
    
    private final DealMilestoneRepository milestoneRepository;
    private static final int MAX_MILESTONES = 3;
    
    /**
     * Creates a milestone for a deal.
     * Enforces maximum 3 milestones rule.
     */
    @Transactional
    public DealMilestone createMilestone(UUID dealId, String title, String description, 
                                        BigDecimal amount, Integer orderIndex) {
        long existingCount = milestoneRepository.countByDealId(dealId);
        if (existingCount >= MAX_MILESTONES) {
            throw new IllegalStateException("Maximum " + MAX_MILESTONES + " milestones allowed per deal");
        }
        
        if (orderIndex < 1 || orderIndex > MAX_MILESTONES) {
            throw new IllegalArgumentException("Order index must be between 1 and " + MAX_MILESTONES);
        }
        
        DealMilestone milestone = DealMilestone.builder()
            .dealId(dealId)
            .orderIndex(orderIndex)
            .title(title)
            .description(description)
            .amount(amount)
            .status(DealMilestone.MilestoneStatus.PENDING)
            .createdAt(Instant.now())
            .updatedAt(Instant.now())
            .build();
        
        return milestoneRepository.save(milestone);
    }
    
    /**
     * Gets all milestones for a deal.
     */
    @Transactional(readOnly = true)
    public List<DealMilestone> getMilestones(UUID dealId) {
        return milestoneRepository.findByDealIdOrderByOrderIndexAsc(dealId);
    }
    
    /**
     * Updates milestone status.
     */
    @Transactional
    public DealMilestone updateMilestoneStatus(UUID milestoneId, DealMilestone.MilestoneStatus status) {
        DealMilestone milestone = milestoneRepository.findById(milestoneId)
            .orElseThrow(() -> new IllegalArgumentException("Milestone not found: " + milestoneId));
        
        milestone.updateStatus(status);
        return milestoneRepository.save(milestone);
    }
}
