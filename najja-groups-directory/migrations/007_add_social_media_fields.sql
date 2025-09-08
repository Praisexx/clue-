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