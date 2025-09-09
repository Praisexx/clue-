CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create groups table according to project specification
CREATE TABLE IF NOT EXISTS groups (
 id BIGSERIAL PRIMARY KEY,
 slug TEXT UNIQUE NOT NULL,
 name TEXT NOT NULL,
 description TEXT,
 address TEXT,
 city TEXT, 
 region TEXT, 
 country TEXT,
 lat DOUBLE PRECISION, 
 lng DOUBLE PRECISION,
 phone TEXT, 
 email TEXT, 
 website TEXT,
 socials JSONB, -- {facebook, instagram, twitter, linkedin}
 meeting_days TEXT[], -- ['Sun','Wed'] etc
 founded_year INT,
 member_size INT,
 membership_type TEXT, -- public|private
 categories TEXT[], -- ['church','association','student']
 tags TEXT[],
 featured BOOLEAN DEFAULT FALSE,
 verified BOOLEAN DEFAULT FALSE,
 views_count BIGINT DEFAULT 0,
 clicks_count BIGINT DEFAULT 0,
 created_at TIMESTAMP DEFAULT now(),
 updated_at TIMESTAMP DEFAULT now()
);

-- Create indexes for performance
-- Create full-text search index (simplified version)
CREATE INDEX IF NOT EXISTS idx_groups_name_search ON groups USING GIN (to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS idx_groups_trgm ON groups USING GIN (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_groups_featured ON groups (featured);
CREATE INDEX IF NOT EXISTS idx_groups_slug ON groups (slug);

-- Create media table for group images/logos
CREATE TABLE IF NOT EXISTS media (
 id BIGSERIAL PRIMARY KEY,
 group_id BIGINT REFERENCES groups(id) ON DELETE CASCADE,
 kind TEXT, -- logo|gallery
 url TEXT NOT NULL,
 width INT, 
 height INT,
 created_at TIMESTAMP DEFAULT now()
);

-- Create contact messages table
CREATE TABLE IF NOT EXISTS contact_messages (
 id BIGSERIAL PRIMARY KEY,
 group_id BIGINT REFERENCES groups(id) ON DELETE CASCADE,
 name TEXT, 
 email TEXT, 
 phone TEXT,
 message TEXT,
 ip INET, 
 user_agent TEXT,
 created_at TIMESTAMP DEFAULT now(),
 handled BOOLEAN DEFAULT FALSE
);

-- Create admin users table
CREATE TABLE IF NOT EXISTS admins (
 id BIGSERIAL PRIMARY KEY,
 email TEXT UNIQUE NOT NULL,
 password_hash TEXT NOT NULL,
 role TEXT NOT NULL DEFAULT 'editor', -- editor|admin
 created_at TIMESTAMP DEFAULT now()
);


ALTER TABLE groups ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Add username column to admins table
ALTER TABLE admins ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;


-- Add status column to groups table for approval workflow
ALTER TABLE groups ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

-- Create index on status for performance
CREATE INDEX IF NOT EXISTS idx_groups_status ON groups (status);

-- Add WhatsApp contact field to groups table
ALTER TABLE groups ADD COLUMN IF NOT EXISTS whatsapp_phone TEXT;

-- Add index for WhatsApp phone searches
CREATE INDEX IF NOT EXISTS idx_groups_whatsapp ON groups (whatsapp_phone);

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

-- Add social media links to groups table
ALTER TABLE groups ADD COLUMN IF NOT EXISTS facebook_url TEXT;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS instagram_url TEXT;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS twitter_url TEXT;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS linkedin_url TEXT;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS youtube_url TEXT;

-- Add indexes for social media fields (for potential filtering/searching)
CREATE INDEX IF NOT EXISTS idx_groups_facebook ON groups(facebook_url) WHERE facebook_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_groups_instagram ON groups(instagram_url) WHERE instagram_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_groups_twitter ON groups(twitter_url) WHERE twitter_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_groups_linkedin ON groups(linkedin_url) WHERE linkedin_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_groups_youtube ON groups(youtube_url) WHERE youtube_url IS NOT NULL;

-- Add comments
COMMENT ON COLUMN groups.facebook_url IS 'Facebook page or profile URL';
COMMENT ON COLUMN groups.instagram_url IS 'Instagram profile URL';
COMMENT ON COLUMN groups.twitter_url IS 'Twitter/X profile URL';
COMMENT ON COLUMN groups.linkedin_url IS 'LinkedIn page or profile URL';
COMMENT ON COLUMN groups.youtube_url IS 'YouTube channel URL';


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

-- Enable PostGIS extension for geospatial queries
CREATE EXTENSION IF NOT EXISTS postgis;

-- Add geometry column for groups table if not exists
ALTER TABLE groups ADD COLUMN IF NOT EXISTS geom GEOGRAPHY(POINT, 4326);

-- Create index on geometry column for fast spatial queries
CREATE INDEX IF NOT EXISTS idx_groups_geom ON groups USING GIST (geom);

-- Update existing records to populate geom column from lat/lng
UPDATE groups 
SET geom = ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
WHERE lat IS NOT NULL AND lng IS NOT NULL AND geom IS NULL;

-- Enable trigram extension for fuzzy text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create trigram index for fuzzy name searches
CREATE INDEX IF NOT EXISTS idx_groups_name_trgm ON groups USING GIN (name gin_trgm_ops);

-- Add a computed column for full-text search
ALTER TABLE groups ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Create function to update search vector
CREATE OR REPLACE FUNCTION update_groups_search_vector() RETURNS trigger AS $$
BEGIN
    NEW.search_vector := to_tsvector('english', 
        coalesce(NEW.name,'') || ' ' || 
        coalesce(NEW.description,'') || ' ' ||
        coalesce(array_to_string(NEW.categories, ' '), '') || ' ' ||
        coalesce(array_to_string(NEW.tags, ' '), '') || ' ' ||
        coalesce(NEW.city,'') || ' ' ||
        coalesce(NEW.region,'') || ' ' ||
        coalesce(NEW.country,'')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update search vector
DROP TRIGGER IF EXISTS groups_search_vector_update ON groups;
CREATE TRIGGER groups_search_vector_update
    BEFORE INSERT OR UPDATE ON groups
    FOR EACH ROW
    EXECUTE FUNCTION update_groups_search_vector();

-- Update existing records
UPDATE groups SET search_vector = to_tsvector('english', 
    coalesce(name,'') || ' ' || 
    coalesce(description,'') || ' ' ||
    coalesce(array_to_string(categories, ' '), '') || ' ' ||
    coalesce(array_to_string(tags, ' '), '') || ' ' ||
    coalesce(city,'') || ' ' ||
    coalesce(region,'') || ' ' ||
    coalesce(country,'')
);

-- Create index on search vector
CREATE INDEX IF NOT EXISTS idx_groups_search_vector ON groups USING GIN (search_vector);