-- MASTER TASK: Add milestoneId to evidence_metadata
ALTER TABLE evidence_metadata 
ADD COLUMN IF NOT EXISTS milestone_id UUID;

-- Create index for milestone-based evidence queries
CREATE INDEX IF NOT EXISTS idx_evidence_deal_milestone 
    ON evidence_metadata(deal_id, milestone_id);

CREATE INDEX IF NOT EXISTS idx_evidence_milestone 
    ON evidence_metadata(milestone_id);

-- Update existing evidence records (if any) - set milestone_id to NULL for now
-- In production, this should be handled by data migration script
