package com.trustescrow.domain.model;

/**
 * Deal categories supported by the platform.
 * Phase 4: Added USED_CAR_PRIVATE and USED_CAR_DEALER.
 * 
 * Note: CAR and HIGH_VALUE_USED remain for backward compatibility.
 * New deals should use USED_CAR_PRIVATE or USED_CAR_DEALER.
 */
public enum DealCategory {
    CAR, // Legacy - use USED_CAR_PRIVATE or USED_CAR_DEALER for new deals
    REAL_ESTATE_RENTAL,
    REAL_ESTATE_SALE,
    HIGH_VALUE_USED, // Legacy
    B2B_DELIVERY,
    // Phase 4 additions
    USED_CAR_PRIVATE,
    USED_CAR_DEALER
}
