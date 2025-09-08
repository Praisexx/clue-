-- Create contact_messages table for storing messages sent to groups
CREATE TABLE IF NOT EXISTS contact_messages (
    id BIGSERIAL PRIMARY KEY,
    group_id BIGINT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    message TEXT NOT NULL,
    ip INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    handled BOOLEAN DEFAULT FALSE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_contact_messages_group_id ON contact_messages(group_id);
CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON contact_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_contact_messages_handled ON contact_messages(handled);
CREATE INDEX IF NOT EXISTS idx_contact_messages_email ON contact_messages(email);

-- Add comment to table
COMMENT ON TABLE contact_messages IS 'Stores contact messages sent to groups through the contact form';