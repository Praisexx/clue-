-- Create group_gallery table for storing multiple images per group
CREATE TABLE IF NOT EXISTS group_gallery (
    id BIGSERIAL PRIMARY KEY,
    group_id BIGINT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    caption TEXT,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_group_gallery_group_id ON group_gallery(group_id);
CREATE INDEX IF NOT EXISTS idx_group_gallery_order ON group_gallery(group_id, display_order);
CREATE INDEX IF NOT EXISTS idx_group_gallery_created_at ON group_gallery(created_at);

-- Add comment to table
COMMENT ON TABLE group_gallery IS 'Stores gallery images for groups with captions and display order';
COMMENT ON COLUMN group_gallery.display_order IS 'Order for displaying images (0 = first, higher numbers later)';
COMMENT ON COLUMN group_gallery.caption IS 'Optional caption/description for the image';