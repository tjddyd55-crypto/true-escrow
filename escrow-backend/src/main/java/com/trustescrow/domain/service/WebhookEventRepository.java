package com.trustescrow.domain.service;

import com.trustescrow.domain.model.WebhookEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface WebhookEventRepository extends JpaRepository<WebhookEvent, UUID> {
    
    /**
     * Find webhook event by provider and event ID (for idempotency check).
     */
    Optional<WebhookEvent> findByProviderAndEventId(String provider, String eventId);
}
