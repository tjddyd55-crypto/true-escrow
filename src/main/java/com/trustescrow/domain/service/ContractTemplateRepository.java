package com.trustescrow.domain.service;

import com.trustescrow.domain.model.ContractTemplate;
import com.trustescrow.domain.model.DealCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface ContractTemplateRepository extends JpaRepository<ContractTemplate, UUID> {
    
    @Query("SELECT MAX(t.version) FROM ContractTemplate t WHERE t.category = :category")
    Optional<Integer> findLatestVersionByCategory(@Param("category") DealCategory category);
    
    @Query("SELECT t FROM ContractTemplate t WHERE t.category = :category ORDER BY t.version DESC LIMIT 1")
    Optional<ContractTemplate> findLatestByCategory(@Param("category") DealCategory category);
}
