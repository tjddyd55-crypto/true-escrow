package com.trustescrow.domain.service;

import com.trustescrow.domain.model.WorkItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface WorkItemRepository extends JpaRepository<WorkItem, UUID> {
    List<WorkItem> findByWorkRuleId(UUID workRuleId);
    List<WorkItem> findByWorkRuleIdAndStatus(UUID workRuleId, WorkItem.WorkItemStatus status);
}
