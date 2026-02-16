package com.trustescrow.domain.service;

import com.trustescrow.domain.model.AssetVersion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AssetVersionRepository extends JpaRepository<AssetVersion, UUID> {
    
    List<AssetVersion> findByAssetIdOrderByCreatedAtDesc(UUID assetId);
    
    Optional<AssetVersion> findByContentHash(String contentHash);
    
    @Query("SELECT v FROM AssetVersion v WHERE v.assetId = :assetId ORDER BY v.createdAt DESC")
    List<AssetVersion> findAllVersionsForAsset(@Param("assetId") UUID assetId);
    
    /**
     * Note: No UPDATE or DELETE methods should be exposed.
     * This repository is for read-only queries and INSERT only.
     */
}
