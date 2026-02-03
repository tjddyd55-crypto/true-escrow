-- Webhook Events Table for Idempotency
-- Stores webhook events to prevent duplicate processing

CREATE TABLE IF NOT EXISTS webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider VARCHAR(50) NOT NULL,
    event_id VARCHAR(255) NOT NULL,
    event_name VARCHAR(100) NOT NULL,
    payload JSONB,
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_webhook_events_provider_event_id 
    ON webhook_events(provider, event_id);

CREATE INDEX IF NOT EXISTS idx_webhook_events_processed 
    ON webhook_events(processed_at);

-- Add index for external_payment_id lookup in payment_infos
CREATE INDEX IF NOT EXISTS idx_payment_infos_external_payment_id 
    ON payment_infos(external_payment_id) 
    WHERE external_payment_id IS NOT NULL;
