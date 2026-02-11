-- escrow_templates: run once to create table and seed QUICK_DELIVERY.
-- Requires DATABASE_URL. Run: psql $DATABASE_URL -f scripts/001_escrow_templates.sql

CREATE TABLE IF NOT EXISTS escrow_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key TEXT UNIQUE NOT NULL,
  label TEXT NOT NULL,
  defaults JSONB NOT NULL,
  constraints JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Seed QUICK_DELIVERY (택배/중고). defaults = TemplateSpec (순수 거래 스펙).
INSERT INTO escrow_templates (template_key, label, defaults, constraints)
VALUES (
  'QUICK_DELIVERY',
  '택배 / 중고 거래',
  '{
    "blocks": [
      {
        "sequence": 1,
        "title_key": "template.quick_delivery.block_payment",
        "amount": { "type": "FULL" },
        "approval": { "role": "buyer", "auto": true }
      },
      {
        "sequence": 2,
        "title_key": "template.quick_delivery.block_receive",
        "amount": { "type": "FULL" },
        "approval": { "role": "buyer", "auto": false }
      }
    ]
  }'::jsonb,
  '{"min_blocks": 2, "sequence_enforced": true, "approval_required": true}'::jsonb
)
ON CONFLICT (template_key) DO NOTHING;
