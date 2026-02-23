ALTER TABLE escrow_mvp_conditions
ADD COLUMN IF NOT EXISTS answer_json JSONB;
