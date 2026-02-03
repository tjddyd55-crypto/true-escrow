package com.trustescrow.domain.service;

import com.trustescrow.domain.model.PaymentInfo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PaymentInfoRepository extends JpaRepository<PaymentInfo, UUID> {
    
    Optional<PaymentInfo> findByDealId(UUID dealId);
    
    List<PaymentInfo> findByBuyerId(UUID buyerId);
    
    List<PaymentInfo> findBySellerId(UUID sellerId);
}
