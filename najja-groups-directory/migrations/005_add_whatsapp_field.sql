-- Add WhatsApp contact field to groups table
ALTER TABLE groups ADD COLUMN IF NOT EXISTS whatsapp_phone TEXT;

-- Add index for WhatsApp phone searches
CREATE INDEX IF NOT EXISTS idx_groups_whatsapp ON groups (whatsapp_phone);