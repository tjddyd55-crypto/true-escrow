package com.trustescrow.domain.service;

import com.trustescrow.domain.model.Partner;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface PartnerRepository extends JpaRepository<Partner, UUID> {
    Optional<Partner> findByDashboardToken(String token);
    Optional<Partner> findByLemonCustomerId(String lemonCustomerId);
    Optional<Partner> findByLemonSubscriptionId(String lemonSubscriptionId);
}
