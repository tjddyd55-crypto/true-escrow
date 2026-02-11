-- Escrow Template i18n: label/description → label_key/description_key (번역 키만 저장)
-- Run after 001_escrow_templates.sql. Requires escrow_templates table.

ALTER TABLE escrow_templates
ADD COLUMN IF NOT EXISTS label_key TEXT,
ADD COLUMN IF NOT EXISTS description_key TEXT;

UPDATE escrow_templates
SET label_key = CASE template_key
  WHEN 'QUICK_DELIVERY' THEN 'template.quick_delivery.title'
  WHEN 'MOVING_SERVICE' THEN 'template.moving_service.title'
  ELSE 'template.unknown.title'
END,
description_key = CASE template_key
  WHEN 'QUICK_DELIVERY' THEN 'template.quick_delivery.description'
  WHEN 'MOVING_SERVICE' THEN 'template.moving_service.description'
  ELSE NULL
END
WHERE label_key IS NULL;

ALTER TABLE escrow_templates
ALTER COLUMN label_key SET NOT NULL;
