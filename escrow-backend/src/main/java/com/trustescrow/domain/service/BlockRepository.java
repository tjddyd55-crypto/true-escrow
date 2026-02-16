package com.trustescrow.domain.service;

import com.trustescrow.domain.model.Block;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface BlockRepository extends JpaRepository<Block, UUID> {
    List<Block> findByTransactionIdOrderByOrderIndexAsc(UUID transactionId);
    List<Block> findByTransactionIdAndIsActiveTrue(UUID transactionId);
}
