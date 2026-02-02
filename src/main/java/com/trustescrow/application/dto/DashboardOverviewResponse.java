package com.trustescrow.application.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class DashboardOverviewResponse {
    private long totalDeals;
    private long activeDeals;
    private long settledThisMonth;
    private BigDecimal totalSettledAmount;
    private BigDecimal thisMonthSettledAmount;
    private BigDecimal totalFees;
    private BigDecimal thisMonthFees;
    private BigDecimal averageDealSize;
    private BigDecimal averageFeePerDeal;
    private double disputeRate;
}
