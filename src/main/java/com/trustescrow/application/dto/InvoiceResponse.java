package com.trustescrow.application.dto;

import com.trustescrow.domain.model.Invoice;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
public class InvoiceResponse {
    private UUID id;
    private String invoiceNumber;
    private UUID partnerId;
    private LocalDate invoiceDate;
    private LocalDate dueDate;
    private Invoice.InvoiceStatus status;
    private BigDecimal totalAmount;
    private String currency;
    private Instant paidAt;
    private Instant createdAt;
    
    public static InvoiceResponse from(Invoice invoice) {
        return InvoiceResponse.builder()
            .id(invoice.getId())
            .invoiceNumber(invoice.getInvoiceNumber())
            .partnerId(invoice.getPartnerId())
            .invoiceDate(invoice.getInvoiceDate())
            .dueDate(invoice.getDueDate())
            .status(invoice.getStatus())
            .totalAmount(invoice.getTotalAmount())
            .currency(invoice.getCurrency())
            .paidAt(invoice.getPaidAt())
            .createdAt(invoice.getCreatedAt())
            .build();
    }
}
