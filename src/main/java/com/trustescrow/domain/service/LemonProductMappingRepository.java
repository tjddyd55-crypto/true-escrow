package com.trustescrow.domain.service;

import com.trustescrow.domain.model.LemonProductMapping;
import com.trustescrow.domain.model.Partner;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface LemonProductMappingRepository extends JpaRepository<LemonProductMapping, UUID> {
    Optional<LemonProductMapping> findByPartnerTier(Partner.SubscriptionTier tier);
}
