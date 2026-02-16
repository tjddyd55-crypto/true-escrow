package com.trustescrow.domain.service;

import com.trustescrow.domain.model.BlockApprover;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface BlockApproverRepository extends JpaRepository<BlockApprover, UUID> {
    List<BlockApprover> findByBlockId(UUID blockId);
}
