package com.trustescrow.application.dto;

import com.trustescrow.domain.model.Partner;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class PartnerResponse {
    private UUID id;
    private String name;
    private String contactEmail;
    private Partner.PricingModel pricingModel;
    private Partner.SubscriptionTier tier;
    private Instant contractAgreedAt;
    private Instant createdAt;
    private String dashboardToken;
    
    public static PartnerResponse from(Partner partner) {
        return PartnerResponse.builder()
            .id(partner.getId())
            .name(partner.getName())
            .contactEmail(partner.getContactEmail())
            .pricingModel(partner.getPricingModel())
            .tier(partner.getTier())
            .contractAgreedAt(partner.getContractAgreedAt())
            .createdAt(partner.getCreatedAt())
            .dashboardToken(partner.getDashboardToken())
            .build();
    }
}
