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