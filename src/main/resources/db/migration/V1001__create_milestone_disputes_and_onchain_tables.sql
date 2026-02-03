-- STEP 6: Milestone Disputes Table
CREATE TABLE IF NOT EXISTS milestone_disputes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_id UUID NOT NULL,
    milestone_id UUID NOT NULL,
    raised_by UUID NOT NULL,
    status VARCHAR(50) NOT NULL,
    reason TEXT NOT NULL,
    evidence_urls TEXT[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID,
    resolved_at TIMESTAMPTZ,
    resolved_by UUID,
    resolution VARCHAR(50),
    resolution_note TEXT
);

CREATE INDEX IF NOT EXISTS idx_milestone_disputes_deal_milestone 
    ON milestone_disputes(deal_id, milestone_id);
CREATE INDEX IF NOT EXISTS idx_milestone_disputes_status 
    ON milestone_disputes(status, created_at);

-- STEP 7: On-Chain Records Table
CREATE TABLE IF NOT EXISTS on_chain_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_id UUID NOT NULL,
    milestone_id UUID NOT NULL,
    amount NUMERIC(19, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    status VARCHAR(50) NOT NULL,
    decided_by VARCHAR(50) NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    transaction_hash VARCHAR(255),
    block_number BIGINT,
    network VARCHAR(50),
    confirmed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_onchain_deal_milestone 
    ON on_chain_records(deal_id, milestone_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_onchain_tx_hash 
    ON on_chain_records(transaction_hash) 
    WHERE transaction_hash IS NOT NULL;
