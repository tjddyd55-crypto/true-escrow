package com.trustescrow.application.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class RevenueSummaryResponse {
    private BigDecimal totalFees;
    private BigDecimal thisMonthFees;
    private BigDecimal averageFeePerDeal;
    private long totalDeals;
}
