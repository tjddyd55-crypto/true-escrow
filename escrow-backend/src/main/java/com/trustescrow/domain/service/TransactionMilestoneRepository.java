package com.trustescrow.domain.service;

import com.trustescrow.domain.model.TransactionMilestone;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TransactionMilestoneRepository extends JpaRepository<TransactionMilestone, UUID> {
    List<TransactionMilestone> findByTransactionIdOrderByOrderIndexAsc(UUID transactionId);
}
