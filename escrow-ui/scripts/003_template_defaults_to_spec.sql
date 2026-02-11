-- Template defaults: TransactionGraph 형태 제거 → TemplateSpec 구조로 통일
-- Run after 002. Updates existing rows only.

UPDATE escrow_templates
SET defaults = '{
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
}'::jsonb
WHERE template_key = 'QUICK_DELIVERY';

UPDATE escrow_templates
SET defaults = '{
  "blocks": [
    {
      "sequence": 1,
      "title_key": "template.moving_service.block_deposit",
      "amount": { "type": "RATIO", "value": 0.2 },
      "approval": { "role": "buyer", "auto": false }
    },
    {
      "sequence": 2,
      "title_key": "template.moving_service.block_start",
      "amount": { "type": "NONE" },
      "approval": { "role": "buyer", "auto": false }
    },
    {
      "sequence": 3,
      "title_key": "template.moving_service.block_complete",
      "amount": { "type": "NONE" },
      "approval": { "role": "buyer", "auto": false }
    },
    {
      "sequence": 4,
      "title_key": "template.moving_service.block_final",
      "amount": { "type": "RATIO", "value": 0.8 },
      "approval": { "role": "buyer", "auto": true }
    }
  ]
}'::jsonb
WHERE template_key = 'MOVING_SERVICE';
