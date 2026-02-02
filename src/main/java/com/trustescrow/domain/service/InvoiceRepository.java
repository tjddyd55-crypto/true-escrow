package com.trustescrow.domain.service;

import com.trustescrow.domain.model.Invoice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, UUID> {
    
    Optional<Invoice> findByInvoiceNumber(String invoiceNumber);
    
    List<Invoice> findByPartnerIdOrderByInvoiceDateDesc(UUID partnerId);
    
    @Query("SELECT i FROM Invoice i WHERE i.partnerId = :partnerId AND i.invoiceDate >= :fromDate AND i.invoiceDate <= :toDate")
    List<Invoice> findByPartnerAndDateRange(
        @Param("partnerId") UUID partnerId,
        @Param("fromDate") LocalDate fromDate,
        @Param("toDate") LocalDate toDate
    );
    
    @Query("SELECT COUNT(i) FROM Invoice i WHERE i.partnerId = :partnerId AND i.invoiceDate >= :startDate AND i.invoiceDate < :endDate")
    long countByPartnerAndMonth(
        @Param("partnerId") UUID partnerId,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate
    );
    
    Optional<Invoice> findByLemonOrderId(String lemonOrderId);
}
