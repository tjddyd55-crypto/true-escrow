-- Expand MVP trade lifecycle schema for submit/reject/resubmit/final-approval flow

ALTER TABLE escrow_mvp_trades
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'DRAFT';

ALTER TABLE escrow_mvp_trades
  DROP CONSTRAINT IF EXISTS escrow_mvp_trades_status_check;

ALTER TABLE escrow_mvp_trades
  ADD CONSTRAINT escrow_mvp_trades_status_check
  CHECK (status IN ('DRAFT', 'ACTIVE', 'COMPLETED'));

ALTER TABLE escrow_mvp_blocks
  ADD COLUMN IF NOT EXISTS start_date TEXT NULL,
  ADD COLUMN IF NOT EXISTS due_date TEXT,
  ADD COLUMN IF NOT EXISTS approval_type TEXT NOT NULL DEFAULT 'MANUAL',
  ADD COLUMN IF NOT EXISTS watchers JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS extended_due_date TEXT NULL;

UPDATE escrow_mvp_blocks
SET due_date = COALESCE(due_date, due_at)
WHERE due_date IS NULL;

ALTER TABLE escrow_mvp_blocks
  ALTER COLUMN due_date SET NOT NULL;

ALTER TABLE escrow_mvp_blocks
  DROP CONSTRAINT IF EXISTS escrow_mvp_blocks_status_check;

ALTER TABLE escrow_mvp_blocks
  ADD CONSTRAINT escrow_mvp_blocks_status_check
  CHECK (status IN ('DRAFT', 'IN_PROGRESS', 'READY_FOR_FINAL_APPROVAL', 'APPROVED', 'DISPUTED', 'ON_HOLD'));

ALTER TABLE escrow_mvp_blocks
  DROP CONSTRAINT IF EXISTS escrow_mvp_blocks_approval_type_check;

ALTER TABLE escrow_mvp_blocks
  ADD CONSTRAINT escrow_mvp_blocks_approval_type_check
  CHECK (approval_type IN ('MANUAL', 'SIMPLE'));

ALTER TABLE escrow_mvp_conditions
  ADD COLUMN IF NOT EXISTS confirmer_role TEXT,
  ADD COLUMN IF NOT EXISTS reject_reason TEXT NULL,
  ADD COLUMN IF NOT EXISTS rejected_by UUID NULL REFERENCES escrow_mvp_users(id),
  ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS resubmitted_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ NULL;

UPDATE escrow_mvp_conditions
SET confirmer_role = COALESCE(confirmer_role, assigned_role)
WHERE confirmer_role IS NULL;

ALTER TABLE escrow_mvp_conditions
  ALTER COLUMN confirmer_role SET NOT NULL;

ALTER TABLE escrow_mvp_conditions
  DROP CONSTRAINT IF EXISTS escrow_mvp_conditions_type_check;

ALTER TABLE escrow_mvp_conditions
  ADD CONSTRAINT escrow_mvp_conditions_type_check
  CHECK (type IN ('CHECK', 'FILE_UPLOAD', 'TEXT', 'NUMBER', 'DATE'));

ALTER TABLE escrow_mvp_conditions
  DROP CONSTRAINT IF EXISTS escrow_mvp_conditions_status_check;

ALTER TABLE escrow_mvp_conditions
  ADD CONSTRAINT escrow_mvp_conditions_status_check
  CHECK (status IN ('PENDING', 'SUBMITTED', 'CONFIRMED', 'REJECTED'));

ALTER TABLE escrow_mvp_conditions
  DROP CONSTRAINT IF EXISTS escrow_mvp_conditions_confirmer_role_check;

ALTER TABLE escrow_mvp_conditions
  ADD CONSTRAINT escrow_mvp_conditions_confirmer_role_check
  CHECK (confirmer_role IN ('BUYER', 'SELLER', 'VERIFIER'));

ALTER TABLE escrow_mvp_audit_logs
  DROP CONSTRAINT IF EXISTS escrow_mvp_audit_logs_action_check;

ALTER TABLE escrow_mvp_audit_logs
  ADD CONSTRAINT escrow_mvp_audit_logs_action_check
  CHECK (
    action IN (
      'INVITE_CREATED',
      'INVITE_ACCEPTED',
      'CONDITION_SUBMITTED',
      'CONDITION_REJECTED',
      'CONDITION_RESUBMITTED',
      'CONDITION_CONFIRMED',
      'BLOCK_FINAL_APPROVED'
    )
  );
