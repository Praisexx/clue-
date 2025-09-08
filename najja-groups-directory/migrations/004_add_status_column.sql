-- Add status column to groups table for approval workflow
ALTER TABLE groups ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

-- Create index on status for performance
CREATE INDEX IF NOT EXISTS idx_groups_status ON groups (status);