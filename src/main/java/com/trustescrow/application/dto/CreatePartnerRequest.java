package com.trustescrow.application.dto;

import com.trustescrow.domain.model.Partner;
import lombok.Data;

@Data
public class CreatePartnerRequest {
    private String name;
    private String contactEmail;
    private Partner.PricingModel pricingModel;
    private Partner.SubscriptionTier tier;
}
