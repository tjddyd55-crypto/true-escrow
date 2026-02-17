ALTER TABLE escrow_block_questions
ADD COLUMN IF NOT EXISTS allow_attachment BOOLEAN NOT NULL DEFAULT false;
