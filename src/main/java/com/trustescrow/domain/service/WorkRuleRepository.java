package com.trustescrow.domain.service;

import com.trustescrow.domain.model.WorkRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface WorkRuleRepository extends JpaRepository<WorkRule, UUID> {
    List<WorkRule> findByBlockId(UUID blockId);
}
