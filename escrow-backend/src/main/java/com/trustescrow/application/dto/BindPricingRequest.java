package com.trustescrow.application.dto;

import com.trustescrow.domain.model.Partner;
import lombok.Data;

@Data
public class BindPricingRequest {
    private Partner.PricingModel pricingModel;
    private Partner.SubscriptionTier tier;
}
