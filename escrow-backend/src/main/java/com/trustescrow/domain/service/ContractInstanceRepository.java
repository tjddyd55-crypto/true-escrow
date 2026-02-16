package com.trustescrow.domain.service;

import com.trustescrow.domain.model.ContractInstance;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface ContractInstanceRepository extends JpaRepository<ContractInstance, UUID> {
    
    Optional<ContractInstance> findByDealId(UUID dealId);
}
