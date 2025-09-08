-- Create analytics tables for tracking group views and clicks

-- Group page views tracking
CREATE TABLE IF NOT EXISTS group_views (
    id BIGSERIAL PRIMARY KEY,
    group_id BIGINT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    ip_address INET,
    user_agent TEXT,
    referrer TEXT,
    session_id TEXT,
    viewed_at TIMESTAMP DEFAULT NOW()
);

-- Group clicks tracking (phone, email, website, social media)
CREATE TABLE IF NOT EXISTS group_clicks (
    id BIGSERIAL PRIMARY KEY,
    group_id BIGINT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    click_type TEXT NOT NULL, -- 'phone', 'email', 'website', 'whatsapp', 'facebook', 'instagram', 'twitter', 'linkedin', 'youtube'
    target_url TEXT,
    ip_address INET,
    user_agent TEXT,
    session_id TEXT,
    clicked_at TIMESTAMP DEFAULT NOW()
);

-- Analytics summary table (updated periodically for performance)
CREATE TABLE IF NOT EXISTS group_analytics_summary (
    id BIGSERIAL PRIMARY KEY,
    group_id BIGINT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    total_views INTEGER DEFAULT 0,
    unique_views INTEGER DEFAULT 0,
    phone_clicks INTEGER DEFAULT 0,
    email_clicks INTEGER DEFAULT 0,
    website_clicks INTEGER DEFAULT 0,
    whatsapp_clicks INTEGER DEFAULT 0,
    social_clicks INTEGER DEFAULT 0,
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(group_id, date)
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_group_views_group_id ON group_views(group_id);
CREATE INDEX IF NOT EXISTS idx_group_views_viewed_at ON group_views(viewed_at);
CREATE INDEX IF NOT EXISTS idx_group_views_ip_session ON group_views(group_id, ip_address, session_id);

CREATE INDEX IF NOT EXISTS idx_group_clicks_group_id ON group_clicks(group_id);
CREATE INDEX IF NOT EXISTS idx_group_clicks_type ON group_clicks(click_type);
CREATE INDEX IF NOT EXISTS idx_group_clicks_clicked_at ON group_clicks(clicked_at);

CREATE INDEX IF NOT EXISTS idx_group_analytics_group_date ON group_analytics_summary(group_id, date);
CREATE INDEX IF NOT EXISTS idx_group_analytics_date ON group_analytics_summary(date);

-- Add comments
COMMENT ON TABLE group_views IS 'Tracks individual page views for groups';
COMMENT ON TABLE group_clicks IS 'Tracks clicks on contact methods and links';
COMMENT ON TABLE group_analytics_summary IS 'Daily summary statistics for group analytics';

-- Update the main groups table with cached analytics
ALTER TABLE groups ADD COLUMN IF NOT EXISTS total_views BIGINT DEFAULT 0;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS total_clicks BIGINT DEFAULT 0;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS last_viewed_at TIMESTAMP;

-- Add indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_groups_total_views ON groups(total_views) WHERE total_views > 0;
CREATE INDEX IF NOT EXISTS idx_groups_last_viewed ON groups(last_viewed_at) WHERE last_viewed_at IS NOT NULL;