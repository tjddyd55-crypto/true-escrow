package com.trustescrow.domain.service;

import com.trustescrow.domain.model.Entitlement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EntitlementRepository extends JpaRepository<Entitlement, UUID> {
    
    List<Entitlement> findByPartnerIdOrderByCreatedAtDesc(UUID partnerId);
    
    @Query("SELECT e FROM Entitlement e WHERE e.partnerId = :partnerId AND e.status = :status")
    List<Entitlement> findByPartnerAndStatus(
        @Param("partnerId") UUID partnerId,
        @Param("status") Entitlement.EntitlementStatus status
    );
    
    @Query("SELECT e FROM Entitlement e WHERE e.partnerId = :partnerId AND e.status = 'ACTIVE' AND e.endDate > :now")
    Optional<Entitlement> findActiveEntitlementForPartner(
        @Param("partnerId") UUID partnerId,
        @Param("now") Instant now
    );
    
    @Query("SELECT e FROM Entitlement e WHERE e.endDate < :now AND e.status = 'ACTIVE'")
    List<Entitlement> findExpiringEntitlements(@Param("now") Instant now);
    
    Optional<Entitlement> findByInvoiceId(UUID invoiceId);
    
    Optional<Entitlement> findByLemonSubscriptionId(String lemonSubscriptionId);
}
