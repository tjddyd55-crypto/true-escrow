-- Escrow Trade MVP Flow schema
-- Includes nullable participant.user_id for invited users

CREATE TABLE IF NOT EXISTS escrow_mvp_users (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS escrow_mvp_trades (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NULL,
  created_by UUID NOT NULL REFERENCES escrow_mvp_users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS escrow_mvp_trade_participants (
  id UUID PRIMARY KEY,
  trade_id UUID NOT NULL REFERENCES escrow_mvp_trades(id) ON DELETE CASCADE,
  user_id UUID NULL REFERENCES escrow_mvp_users(id),
  role TEXT NOT NULL CHECK (role IN ('BUYER', 'SELLER', 'VERIFIER')),
  status TEXT NOT NULL CHECK (status IN ('INVITED', 'ACCEPTED', 'DECLINED')),
  invite_type TEXT NOT NULL CHECK (invite_type IN ('EMAIL', 'PHONE')),
  invite_target TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Minimal migration requirement: invited participant can exist without user binding yet
ALTER TABLE escrow_mvp_trade_participants
  ALTER COLUMN user_id DROP NOT NULL;

CREATE TABLE IF NOT EXISTS escrow_mvp_invites (
  id UUID PRIMARY KEY,
  trade_id UUID NOT NULL REFERENCES escrow_mvp_trades(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES escrow_mvp_trade_participants(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL CHECK (status IN ('PENDING', 'ACCEPTED', 'DECLINED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS escrow_mvp_blocks (
  id UUID PRIMARY KEY,
  trade_id UUID NOT NULL REFERENCES escrow_mvp_trades(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  due_at TEXT NOT NULL,
  final_approver_role TEXT NOT NULL CHECK (final_approver_role IN ('BUYER', 'SELLER', 'VERIFIER')),
  status TEXT NOT NULL CHECK (status IN ('DRAFT', 'OPEN', 'FINAL_APPROVED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS escrow_mvp_conditions (
  id UUID PRIMARY KEY,
  block_id UUID NOT NULL REFERENCES escrow_mvp_blocks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NULL,
  type TEXT NOT NULL CHECK (type IN ('CHECK', 'FILE')),
  required BOOLEAN NOT NULL DEFAULT true,
  assigned_role TEXT NOT NULL CHECK (assigned_role IN ('BUYER', 'SELLER', 'VERIFIER')),
  status TEXT NOT NULL CHECK (status IN ('PENDING', 'CONFIRMED')),
  confirmed_by UUID NULL REFERENCES escrow_mvp_users(id),
  confirmed_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS escrow_mvp_audit_logs (
  id UUID PRIMARY KEY,
  trade_id UUID NOT NULL REFERENCES escrow_mvp_trades(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (
    action IN ('INVITE_CREATED', 'INVITE_ACCEPTED', 'CONDITION_CONFIRMED', 'BLOCK_FINAL_APPROVED')
  ),
  actor_user_id UUID NULL REFERENCES escrow_mvp_users(id),
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
