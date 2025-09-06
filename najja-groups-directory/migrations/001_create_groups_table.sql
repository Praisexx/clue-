-- Enable PostGIS extension for geographic data
CREATE EXTENSION IF NOT EXISTS postgis;

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
 geom GEOGRAPHY(POINT, 4326),
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
CREATE INDEX IF NOT EXISTS idx_groups_geom ON groups USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_groups_fts ON groups USING GIN (to_tsvector('simple', coalesce(name,'')||' '||coalesce(array_to_string(categories,' '), '')||' '||coalesce(array_to_string(tags,' '), '')));
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