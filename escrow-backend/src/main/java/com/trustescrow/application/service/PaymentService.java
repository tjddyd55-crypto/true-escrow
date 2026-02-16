package com.trustescrow.application.service;

import com.trustescrow.domain.model.Deal;
import com.trustescrow.domain.model.PaymentInfo;
import com.trustescrow.domain.service.DealRepository;
import com.trustescrow.domain.service.PaymentInfoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

/**
 * Service for managing payment information.
 * Dedicated payment setup page.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentService {
    
    private final PaymentInfoRepository paymentInfoRepository;
    private final DealRepository dealRepository;
    
    /**
     * Creates or updates payment info for a deal.
     */
    @Transactional
    public PaymentInfo createOrUpdatePaymentInfo(UUID dealId, UUID buyerId, UUID sellerId, 
                                                 String paymentMethod, String paymentProvider) {
        Deal deal = dealRepository.findById(dealId)
            .orElseThrow(() -> new IllegalArgumentException("Deal not found: " + dealId));
        
        PaymentInfo paymentInfo = paymentInfoRepository.findByDealId(dealId)
            .orElseGet(() -> {
                PaymentInfo newInfo = PaymentInfo.builder()
                    .dealId(dealId)
                    .buyerId(buyerId)
                    .sellerId(sellerId)
                    .totalAmount(deal.getTotalAmount())
                    .currency(deal.getCurrency())
                    .status(PaymentInfo.PaymentStatus.PENDING)
                    .createdAt(Instant.now())
                    .updatedAt(Instant.now())
                    .build();
                return paymentInfoRepository.save(newInfo);
            });
        
        // Update payment method and provider
        paymentInfo = PaymentInfo.builder()
            .id(paymentInfo.getId())
            .dealId(paymentInfo.getDealId())
            .buyerId(paymentInfo.getBuyerId())
            .sellerId(paymentInfo.getSellerId())
            .totalAmount(paymentInfo.getTotalAmount())
            .currency(paymentInfo.getCurrency())
            .status(paymentInfo.getStatus())
            .createdAt(paymentInfo.getCreatedAt())
            .updatedAt(Instant.now())
            .paymentMethod(paymentMethod)
            .paymentProvider(paymentProvider)
            .externalPaymentId(paymentInfo.getExternalPaymentId())
            .paidAt(paymentInfo.getPaidAt())
            .failureReason(paymentInfo.getFailureReason())
            .build();
        
        return paymentInfoRepository.save(paymentInfo);
    }
    
    /**
     * Gets payment info for a deal.
     */
    @Transactional(readOnly = true)
    public Optional<PaymentInfo> getPaymentInfo(UUID dealId) {
        return paymentInfoRepository.findByDealId(dealId);
    }
    
    /**
     * Updates payment status.
     */
    @Transactional
    public PaymentInfo updatePaymentStatus(UUID dealId, PaymentInfo.PaymentStatus status, 
                                          String externalPaymentId) {
        PaymentInfo paymentInfo = paymentInfoRepository.findByDealId(dealId)
            .orElseThrow(() -> new IllegalArgumentException("Payment info not found for deal: " + dealId));
        
        paymentInfo = PaymentInfo.builder()
            .id(paymentInfo.getId())
            .dealId(paymentInfo.getDealId())
            .buyerId(paymentInfo.getBuyerId())
            .sellerId(paymentInfo.getSellerId())
            .totalAmount(paymentInfo.getTotalAmount())
            .currency(paymentInfo.getCurrency())
            .status(status)
            .createdAt(paymentInfo.getCreatedAt())
            .updatedAt(Instant.now())
            .paymentMethod(paymentInfo.getPaymentMethod())
            .paymentProvider(paymentInfo.getPaymentProvider())
            .externalPaymentId(externalPaymentId != null ? externalPaymentId : paymentInfo.getExternalPaymentId())
            .paidAt(status == PaymentInfo.PaymentStatus.PAID ? Instant.now() : paymentInfo.getPaidAt())
            .failureReason(paymentInfo.getFailureReason())
            .build();
        
        paymentInfo.updateStatus(status);
        return paymentInfoRepository.save(paymentInfo);
    }
}
