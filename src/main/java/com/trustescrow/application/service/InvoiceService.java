package com.trustescrow.application.service;

import com.trustescrow.domain.model.Invoice;
import com.trustescrow.domain.model.Partner;
import com.trustescrow.domain.model.RevenueLedgerEntry;
import com.trustescrow.domain.service.InvoiceRepository;
import com.trustescrow.domain.service.PartnerRepository;
import com.trustescrow.domain.service.RevenueLedgerRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Invoice Service for Phase 10.
 * Generates monthly invoices for partners.
 * Supports Lemon Squeezy payment integration.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class InvoiceService {
    
    private final InvoiceRepository invoiceRepository;
    private final PartnerRepository partnerRepository;
    private final RevenueLedgerRepository revenueLedgerRepository;
    
    /**
     * Generate invoices for all partners for the previous month.
     * Should be called on the 1st of each month.
     */
    @Transactional
    public void generateMonthlyInvoices() {
        LocalDate invoiceDate = LocalDate.now().withDayOfMonth(1).minusMonths(1); // Previous month
        LocalDate dueDate = invoiceDate.plusDays(14); // Net-14
        
        log.info("Generating invoices for month: {}", invoiceDate);
        
        List<Partner> partners = partnerRepository.findAll();
        
        for (Partner partner : partners) {
            try {
                generateInvoiceForPartner(partner, invoiceDate, dueDate);
            } catch (Exception e) {
                log.error("Error generating invoice for partner {}: {}", partner.getId(), e.getMessage(), e);
                // Continue with other partners
            }
        }
    }
    
    /**
     * Generate invoice for a specific partner.
     */
    @Transactional
    public Invoice generateInvoiceForPartner(Partner partner, LocalDate invoiceDate, LocalDate dueDate) {
        // Check if invoice already exists for this month
        long existingCount = invoiceRepository.countByPartnerAndMonth(
            partner.getId(),
            invoiceDate,
            invoiceDate.plusMonths(1)
        );
        
        if (existingCount > 0) {
            log.info("Invoice already exists for partner {} for month {}", partner.getId(), invoiceDate);
            return null;
        }
        
        // Find uninvoiced revenue entries
        List<RevenueLedgerEntry> entries = revenueLedgerRepository.findUninvoicedByPartner(partner.getId());
        
        if (entries.isEmpty()) {
            log.info("No revenue entries to invoice for partner {}", partner.getId());
            return null;
        }
        
        // Calculate totals
        BigDecimal totalAmount = entries.stream()
            .map(RevenueLedgerEntry::getAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        String currency = entries.get(0).getCurrency();
        
        // Generate invoice number
        String invoiceNumber = generateInvoiceNumber(partner, invoiceDate, existingCount);
        
        // Create line items JSON (simplified for Phase 9)
        String lineItemsJson = buildLineItemsJson(entries);
        
        // Create invoice
        Invoice invoice = Invoice.builder()
            .invoiceNumber(invoiceNumber)
            .partnerId(partner.getId())
            .invoiceDate(invoiceDate)
            .dueDate(dueDate)
            .status(Invoice.InvoiceStatus.PENDING)
            .totalAmount(totalAmount)
            .currency(currency)
            .lineItemsJson(lineItemsJson)
            .createdAt(Instant.now())
            .updatedAt(Instant.now())
            .build();
        
        invoice = invoiceRepository.save(invoice);
        
        // Assign revenue entries to invoice
        for (RevenueLedgerEntry entry : entries) {
            entry.assignToInvoice(invoice.getId());
            revenueLedgerRepository.save(entry);
        }
        
        log.info("Invoice generated for partner {}: {}", partner.getId(), invoiceNumber);
        return invoice;
    }
    
    /**
     * Get invoice by ID.
     */
    public Invoice getInvoice(UUID invoiceId) {
        return invoiceRepository.findById(invoiceId)
            .orElseThrow(() -> new IllegalArgumentException("Invoice not found: " + invoiceId));
    }
    
    /**
     * Mark invoice as sent.
     */
    @Transactional
    public void markInvoiceAsSent(UUID invoiceId) {
        Invoice invoice = invoiceRepository.findById(invoiceId)
            .orElseThrow(() -> new IllegalArgumentException("Invoice not found: " + invoiceId));
        
        invoice.markAsSent();
        invoiceRepository.save(invoice);
    }
    
    /**
     * Mark invoice as paid.
     */
    @Transactional
    public void markInvoiceAsPaid(UUID invoiceId, Instant paidAt, String lemonOrderId) {
        Invoice invoice = invoiceRepository.findById(invoiceId)
            .orElseThrow(() -> new IllegalArgumentException("Invoice not found: " + invoiceId));
        
        invoice.markAsPaid(paidAt, lemonOrderId);
        invoiceRepository.save(invoice);
    }
    
    private String generateInvoiceNumber(Partner partner, LocalDate invoiceDate, long sequence) {
        String yearMonth = invoiceDate.format(java.time.format.DateTimeFormatter.ofPattern("yyyyMM"));
        String partnerShort = partner.getId().toString().substring(0, 8);
        return String.format("INV-%s-%s-%03d", yearMonth, partnerShort, sequence + 1);
    }
    
    private String buildLineItemsJson(List<RevenueLedgerEntry> entries) {
        // Simplified JSON for Phase 9
        // In production, use proper JSON library
        StringBuilder json = new StringBuilder("[");
        for (int i = 0; i < entries.size(); i++) {
            RevenueLedgerEntry entry = entries.get(i);
            if (i > 0) json.append(",");
            json.append(String.format(
                "{\"description\":\"Platform Fee - Deal %s\",\"amount\":%s}",
                entry.getDealId().toString().substring(0, 8),
                entry.getAmount()
            ));
        }
        json.append("]");
        return json.toString();
    }
}
