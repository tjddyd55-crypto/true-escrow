package com.trustescrow.application.service;

import com.trustescrow.application.dto.*;
import com.trustescrow.domain.model.*;
import com.trustescrow.domain.service.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Partner Dashboard Service for Phase 9.
 * Provides read-only access to partner metrics and data.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PartnerDashboardService {
    
    private final PartnerRepository partnerRepository;
    private final DealRepository dealRepository;
    private final RevenueLedgerRepository revenueLedgerRepository;
    private final InvoiceRepository invoiceRepository;
    
    /**
     * Get dashboard overview for partner.
     */
    @Transactional(readOnly = true)
    public DashboardOverviewResponse getOverview(UUID partnerId) {
        Partner partner = partnerRepository.findById(partnerId)
            .orElseThrow(() -> new IllegalArgumentException("Partner not found: " + partnerId));
        
        // Get all deals for this partner (Phase 9: assume seller is partner)
        List<Deal> allDeals = dealRepository.findAll().stream()
            .filter(deal -> deal.getSellerId().equals(partnerId))
            .collect(Collectors.toList());
        
        // Calculate metrics
        long totalDeals = allDeals.size();
        long activeDeals = allDeals.stream()
            .filter(deal -> deal.getState() != DealState.SETTLED)
            .count();
        
        LocalDate now = LocalDate.now();
        LocalDate startOfMonth = now.withDayOfMonth(1);
        Instant startOfMonthInstant = startOfMonth.atStartOfDay(ZoneId.systemDefault()).toInstant();
        Instant endOfMonthInstant = now.atTime(23, 59, 59).atZone(ZoneId.systemDefault()).toInstant();
        
        long settledThisMonth = allDeals.stream()
            .filter(deal -> deal.getState() == DealState.SETTLED)
            .filter(deal -> deal.getUpdatedAt().isAfter(startOfMonthInstant) && 
                           deal.getUpdatedAt().isBefore(endOfMonthInstant))
            .count();
        
        BigDecimal totalSettledAmount = allDeals.stream()
            .filter(deal -> deal.getState() == DealState.SETTLED)
            .map(Deal::getTotalAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        BigDecimal thisMonthSettledAmount = allDeals.stream()
            .filter(deal -> deal.getState() == DealState.SETTLED)
            .filter(deal -> deal.getUpdatedAt().isAfter(startOfMonthInstant) && 
                           deal.getUpdatedAt().isBefore(endOfMonthInstant))
            .map(Deal::getTotalAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        List<RevenueLedgerEntry> allRevenue = revenueLedgerRepository.findByPartnerIdOrderByCreatedAtDesc(partnerId);
        BigDecimal totalFees = allRevenue.stream()
            .map(RevenueLedgerEntry::getAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        List<RevenueLedgerEntry> thisMonthRevenue = revenueLedgerRepository.findByPartnerAndDateRange(
            partnerId, startOfMonthInstant, endOfMonthInstant);
        BigDecimal thisMonthFees = thisMonthRevenue.stream()
            .map(RevenueLedgerEntry::getAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        BigDecimal averageDealSize = totalDeals > 0 
            ? totalSettledAmount.divide(BigDecimal.valueOf(totalDeals), 2, RoundingMode.HALF_UP)
            : BigDecimal.ZERO;
        
        BigDecimal averageFeePerDeal = allRevenue.size() > 0
            ? totalFees.divide(BigDecimal.valueOf(allRevenue.size()), 2, RoundingMode.HALF_UP)
            : BigDecimal.ZERO;
        
        long totalDisputes = allDeals.stream()
            .filter(deal -> deal.getState() == DealState.ISSUE)
            .count();
        
        double disputeRate = totalDeals > 0 
            ? (double) totalDisputes / totalDeals * 100.0
            : 0.0;
        
        return DashboardOverviewResponse.builder()
            .totalDeals(totalDeals)
            .activeDeals(activeDeals)
            .settledThisMonth(settledThisMonth)
            .totalSettledAmount(totalSettledAmount)
            .thisMonthSettledAmount(thisMonthSettledAmount)
            .totalFees(totalFees)
            .thisMonthFees(thisMonthFees)
            .averageDealSize(averageDealSize)
            .averageFeePerDeal(averageFeePerDeal)
            .disputeRate(disputeRate)
            .build();
    }
    
    /**
     * Get partner deals (read-only).
     */
    @Transactional(readOnly = true)
    public List<DealResponse> getPartnerDeals(UUID partnerId, String status) {
        List<Deal> deals = dealRepository.findAll().stream()
            .filter(deal -> deal.getSellerId().equals(partnerId))
            .filter(deal -> status == null || deal.getState().name().equals(status))
            .collect(Collectors.toList());
        
        return deals.stream()
            .map(DealResponse::from)
            .collect(Collectors.toList());
    }
    
    /**
     * Get revenue summary.
     */
    @Transactional(readOnly = true)
    public RevenueSummaryResponse getRevenueSummary(UUID partnerId) {
        List<RevenueLedgerEntry> allRevenue = revenueLedgerRepository.findByPartnerIdOrderByCreatedAtDesc(partnerId);
        
        BigDecimal totalFees = allRevenue.stream()
            .map(RevenueLedgerEntry::getAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        LocalDate now = LocalDate.now();
        LocalDate startOfMonth = now.withDayOfMonth(1);
        Instant startOfMonthInstant = startOfMonth.atStartOfDay(ZoneId.systemDefault()).toInstant();
        Instant endOfMonthInstant = now.atTime(23, 59, 59).atZone(ZoneId.systemDefault()).toInstant();
        
        List<RevenueLedgerEntry> thisMonthRevenue = revenueLedgerRepository.findByPartnerAndDateRange(
            partnerId, startOfMonthInstant, endOfMonthInstant);
        BigDecimal thisMonthFees = thisMonthRevenue.stream()
            .map(RevenueLedgerEntry::getAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        BigDecimal averageFeePerDeal = allRevenue.size() > 0
            ? totalFees.divide(BigDecimal.valueOf(allRevenue.size()), 2, RoundingMode.HALF_UP)
            : BigDecimal.ZERO;
        
        // Fee breakdown by category (simplified for Phase 9)
        // In production, would need to join with Deal table
        
        return RevenueSummaryResponse.builder()
            .totalFees(totalFees)
            .thisMonthFees(thisMonthFees)
            .averageFeePerDeal(averageFeePerDeal)
            .totalDeals(allRevenue.size())
            .build();
    }
    
    /**
     * Get partner invoices.
     */
    @Transactional(readOnly = true)
    public List<InvoiceResponse> getPartnerInvoices(UUID partnerId) {
        List<Invoice> invoices = invoiceRepository.findByPartnerIdOrderByInvoiceDateDesc(partnerId);
        
        return invoices.stream()
            .map(InvoiceResponse::from)
            .collect(Collectors.toList());
    }
}
