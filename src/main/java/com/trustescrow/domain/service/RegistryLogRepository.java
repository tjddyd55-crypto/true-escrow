package com.trustescrow.domain.service;

import com.trustescrow.domain.model.RegistryLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface RegistryLogRepository extends JpaRepository<RegistryLog, UUID> {
    
    List<RegistryLog> findByAssetIdOrderByCreatedAtDesc(UUID assetId);
    
    List<RegistryLog> findByEscrowAccountIdOrderByCreatedAtDesc(UUID escrowAccountId);
    
    List<RegistryLog> findByEventTypeOrderByCreatedAtDesc(RegistryLog.EventType eventType);
    
    @Query("SELECT r FROM RegistryLog r WHERE r.assetId = :assetId AND r.eventType = :eventType ORDER BY r.createdAt DESC")
    List<RegistryLog> findByAssetAndEventType(
        @Param("assetId") UUID assetId,
        @Param("eventType") RegistryLog.EventType eventType
    );
    
    @Query("SELECT r FROM RegistryLog r WHERE r.createdAt >= :fromDate AND r.createdAt < :toDate ORDER BY r.createdAt ASC")
    List<RegistryLog> findByDateRange(
        @Param("fromDate") Instant fromDate,
        @Param("toDate") Instant toDate
    );
    
    /**
     * Note: No UPDATE or DELETE methods should be exposed.
     * This repository is for read-only queries and INSERT only.
     * Used for audit trail and blockchain anchoring.
     */
}
