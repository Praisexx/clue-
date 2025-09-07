-- Add logo_url column to groups table
ALTER TABLE groups ADD COLUMN IF NOT EXISTS logo_url TEXT;