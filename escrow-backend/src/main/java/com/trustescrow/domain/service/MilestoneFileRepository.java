package com.trustescrow.domain.service;

import com.trustescrow.domain.model.MilestoneFile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface MilestoneFileRepository extends JpaRepository<MilestoneFile, UUID> {
    List<MilestoneFile> findByMilestoneId(UUID milestoneId);
}
