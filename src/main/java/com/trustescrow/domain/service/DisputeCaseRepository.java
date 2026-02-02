package com.trustescrow.domain.service;

import com.trustescrow.domain.model.DisputeCase;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface DisputeCaseRepository extends JpaRepository<DisputeCase, UUID> {
    
    List<DisputeCase> findByStatus(DisputeCase.DisputeStatus status);
}
