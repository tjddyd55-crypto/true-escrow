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

-- Seed QUICK_DELIVERY (택배/중고). defaults = full TransactionGraph shape for engine.
INSERT INTO escrow_templates (template_key, label, defaults, constraints)
VALUES (
  'QUICK_DELIVERY',
  '택배 / 중고 거래',
  '{
    "transaction": {
      "id": "template-tx",
      "title": "중고 물품 택배 거래",
      "description": "물품 수령 후 대금이 지급됩니다.",
      "initiatorId": "00000000-0000-0000-0000-000000000001",
      "initiatorRole": "BUYER",
      "status": "DRAFT",
      "createdAt": "2026-02-01T00:00:00.000Z",
      "buyerId": "00000000-0000-0000-0000-000000000001",
      "sellerId": "00000000-0000-0000-0000-000000000002",
      "startDate": "2026-02-01",
      "endDate": "2026-02-28"
    },
    "blocks": [
      {
        "id": "block-1",
        "transactionId": "template-tx",
        "title": "결제",
        "startDate": "2026-02-01",
        "endDate": "2026-02-14",
        "orderIndex": 1,
        "approvalPolicyId": "policy-1",
        "isActive": false
      },
      {
        "id": "block-2",
        "transactionId": "template-tx",
        "title": "수령 확인",
        "startDate": "2026-02-15",
        "endDate": "2026-02-28",
        "orderIndex": 2,
        "approvalPolicyId": "policy-2",
        "isActive": false
      }
    ],
    "approvalPolicies": [
      { "id": "policy-1", "type": "SINGLE" },
      { "id": "policy-2", "type": "SINGLE" }
    ],
    "blockApprovers": [
      { "id": "approver-1", "blockId": "block-1", "role": "BUYER", "required": true },
      { "id": "approver-2", "blockId": "block-2", "role": "BUYER", "required": true }
    ],
    "workRules": [
      {
        "id": "rule-1",
        "blockId": "block-1",
        "workType": "CUSTOM",
        "title": "결제",
        "quantity": 1,
        "frequency": "ONCE",
        "dueDates": [7]
      },
      {
        "id": "rule-2",
        "blockId": "block-2",
        "workType": "DELIVERY",
        "title": "수령 확인",
        "quantity": 1,
        "frequency": "ONCE",
        "dueDates": [28]
      }
    ],
    "workItems": []
  }'::jsonb,
  '{"min_blocks": 2, "sequence_enforced": true, "approval_required": true}'::jsonb
)
ON CONFLICT (template_key) DO NOTHING;
