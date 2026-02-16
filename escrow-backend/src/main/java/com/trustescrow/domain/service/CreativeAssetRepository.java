package com.trustescrow.domain.service;

import com.trustescrow.domain.model.CreativeAsset;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CreativeAssetRepository extends JpaRepository<CreativeAsset, UUID> {
    
    List<CreativeAsset> findByEscrowAccountIdOrderByCreatedAtDesc(UUID escrowAccountId);
    
    List<CreativeAsset> findByAssetType(CreativeAsset.AssetType assetType);
    
    @Query("SELECT a FROM CreativeAsset a WHERE a.escrowAccountId = :accountId AND a.visibility = :visibility")
    List<CreativeAsset> findByAccountAndVisibility(
        @Param("accountId") UUID accountId,
        @Param("visibility") CreativeAsset.Visibility visibility
    );
    
    /**
     * Note: No UPDATE or DELETE methods should be exposed.
     * This repository is for read-only queries and INSERT only.
     */
}
