package com.trustescrow.domain.service;

import com.trustescrow.domain.model.RevenueLedgerEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface RevenueLedgerRepository extends JpaRepository<RevenueLedgerEntry, UUID> {

    List<RevenueLedgerEntry> findByPartnerIdOrderByCreatedAtDesc(UUID partnerId);

    @Query("SELECT r FROM RevenueLedgerEntry r WHERE r.partnerId = :partnerId AND r.invoiceId IS NULL")
    List<RevenueLedgerEntry> findUninvoicedByPartner(@Param("partnerId") UUID partnerId);

    @Query("SELECT r FROM RevenueLedgerEntry r WHERE r.partnerId = :partnerId AND r.settledAt >= :fromDate AND r.settledAt < :toDate")
    List<RevenueLedgerEntry> findByPartnerAndDateRange(
        @Param("partnerId") UUID partnerId,
        @Param("fromDate") Instant fromDate,
        @Param("toDate") Instant toDate
    );
}
