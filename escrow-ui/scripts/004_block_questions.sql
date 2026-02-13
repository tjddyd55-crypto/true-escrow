-- Block Questions: answers and attachments tables.
-- Assumes escrow_block_questions (and idx_escrow_block_questions_block) exist.
-- If escrow_block_questions does not exist, run a prior migration to create it with:
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   block_id UUID NOT NULL,
--   order_index INT NOT NULL,
--   type TEXT NOT NULL,
--   label TEXT,
--   description TEXT,
--   required BOOLEAN DEFAULT false,
--   options JSONB,
--   created_at TIMESTAMPTZ DEFAULT now()
--   and: CREATE INDEX idx_escrow_block_questions_block ON escrow_block_questions(block_id);
--   and: UNIQUE(block_id, order_index).

-- Optional: create escrow_block_questions if not present (for greenfield DBs).
CREATE TABLE IF NOT EXISTS escrow_block_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  block_id UUID NOT NULL,
  order_index INT NOT NULL,
  type TEXT NOT NULL DEFAULT 'SHORT_TEXT',
  label TEXT,
  description TEXT,
  required BOOLEAN DEFAULT false,
  options JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_escrow_block_questions_block ON escrow_block_questions(block_id);
DROP INDEX IF EXISTS idx_escrow_block_questions_block_order;
CREATE UNIQUE INDEX IF NOT EXISTS idx_escrow_block_questions_block_order ON escrow_block_questions(block_id, order_index);

-- Answers: one row per (trade, block, question, actor_role) for latest answer.
CREATE TABLE IF NOT EXISTS escrow_block_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_id UUID NOT NULL,
  block_id UUID NOT NULL,
  question_id UUID NOT NULL,
  actor_role TEXT NOT NULL,
  answer JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_escrow_block_answers_trade_question_actor
  ON escrow_block_answers(trade_id, question_id, actor_role);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'escrow_block_answers_trade_block_question_actor_key'
  ) THEN
    ALTER TABLE escrow_block_answers
      ADD CONSTRAINT escrow_block_answers_trade_block_question_actor_key
      UNIQUE (trade_id, block_id, question_id, actor_role);
  END IF;
END $$;

-- Attachments: metadata only; storage_provider/object_key for future S3/R2.
CREATE TABLE IF NOT EXISTS escrow_block_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_id UUID NOT NULL,
  block_id UUID NOT NULL,
  question_id UUID,
  uploader_role TEXT NOT NULL,
  storage_provider TEXT,
  object_key TEXT,
  file_name TEXT,
  mime TEXT,
  size BIGINT,
  status TEXT NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_escrow_block_attachments_trade_block
  ON escrow_block_attachments(trade_id, block_id);
