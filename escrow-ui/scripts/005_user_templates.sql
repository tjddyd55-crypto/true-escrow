-- User templates for reusing designed trade flows.
-- Run: psql $DATABASE_URL -f scripts/005_user_templates.sql

CREATE TABLE IF NOT EXISTS escrow_user_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  source_trade_id UUID,
  template_json JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_escrow_user_templates_owner_created
  ON escrow_user_templates(owner_user_id, created_at DESC);
