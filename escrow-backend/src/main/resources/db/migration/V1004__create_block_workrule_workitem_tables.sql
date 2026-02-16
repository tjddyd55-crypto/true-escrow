-- Block/WorkRule/WorkItem Architecture Tables
-- Replaces milestone-based structure with design-oriented transaction model

-- Approval Policies
CREATE TABLE IF NOT EXISTS approval_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(50) NOT NULL, -- SINGLE | ALL | ANY | THRESHOLD
    threshold INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Blocks (approval units)
CREATE TABLE IF NOT EXISTS blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    start_day INTEGER NOT NULL,
    end_day INTEGER NOT NULL,
    order_index INTEGER NOT NULL,
    approval_policy_id UUID REFERENCES approval_policies(id),
    is_active BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blocks_transaction ON blocks(transaction_id, order_index);

-- Block Approvers
CREATE TABLE IF NOT EXISTS block_approvers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    block_id UUID NOT NULL REFERENCES blocks(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL, -- BUYER | SELLER | VERIFIER
    user_id UUID,
    required BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_block_approvers_block ON block_approvers(block_id);

-- Work Rules (work rules core)
CREATE TABLE IF NOT EXISTS work_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    block_id UUID NOT NULL REFERENCES blocks(id) ON DELETE CASCADE,
    work_type VARCHAR(50) NOT NULL, -- BLOG | DOCUMENT | INSPECTION | CUSTOM
    description TEXT,
    quantity INTEGER NOT NULL DEFAULT 1,
    frequency VARCHAR(50) NOT NULL, -- ONCE | DAILY | WEEKLY | CUSTOM
    due_dates INTEGER[], -- Specific day numbers
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_work_rules_block ON work_rules(block_id);

-- Work Items (auto-generated from WorkRules)
CREATE TABLE IF NOT EXISTS work_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    work_rule_id UUID NOT NULL REFERENCES work_rules(id) ON DELETE CASCADE,
    due_date INTEGER NOT NULL, -- Day number
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING', -- PENDING | SUBMITTED | APPROVED
    submitted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_work_items_work_rule ON work_items(work_rule_id);
CREATE INDEX IF NOT EXISTS idx_work_items_status ON work_items(status);

-- Update transactions table to add initiator_role
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS initiator_role VARCHAR(50),
ADD COLUMN IF NOT EXISTS description TEXT;
