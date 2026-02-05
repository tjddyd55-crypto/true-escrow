-- Transaction-based Escrow UX Tables
-- Simplified structure for demo/simulation purposes

-- Transactions (simplified version of deals for UX demo)
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    buyer_id UUID NOT NULL,
    seller_id UUID NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'CREATED',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_buyer ON transactions(buyer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_seller ON transactions(seller_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);

-- Milestones (for transaction milestones)
CREATE TABLE IF NOT EXISTS transaction_milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    amount NUMERIC(19, 2) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    order_index INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transaction_milestones_transaction ON transaction_milestones(transaction_id, order_index);

-- Files (uploaded files for milestones)
CREATE TABLE IF NOT EXISTS milestone_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    milestone_id UUID NOT NULL REFERENCES transaction_milestones(id) ON DELETE CASCADE,
    uploader_role VARCHAR(20) NOT NULL, -- BUYER, SELLER
    file_url TEXT NOT NULL,
    file_name TEXT,
    file_size BIGINT,
    mime_type VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_milestone_files_milestone ON milestone_files(milestone_id);

-- Activity Logs (transaction activity tracking)
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    actor_role VARCHAR(20) NOT NULL, -- BUYER, SELLER, ADMIN
    action TEXT NOT NULL,
    meta JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_transaction ON activity_logs(transaction_id, created_at);
