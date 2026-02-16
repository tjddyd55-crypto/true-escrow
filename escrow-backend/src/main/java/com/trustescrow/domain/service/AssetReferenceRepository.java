package com.trustescrow.domain.service;

import com.trustescrow.domain.model.AssetReference;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AssetReferenceRepository extends JpaRepository<AssetReference, UUID> {
    
    List<AssetReference> findByAssetIdOrderByCreatedAtDesc(UUID assetId);
    
    @Query("SELECT r FROM AssetReference r WHERE r.contextType = :contextType AND r.contextId = :contextId")
    List<AssetReference> findByContext(
        @Param("contextType") AssetReference.ContextType contextType,
        @Param("contextId") UUID contextId
    );
    
    /**
     * Note: No UPDATE or DELETE methods should be exposed.
     * This repository is for read-only queries and INSERT only.
     */
}
