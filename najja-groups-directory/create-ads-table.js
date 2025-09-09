const { Pool } = require('pg');
const fs = require('fs');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('render.com') ? { rejectUnauthorized: false } : false
});

async function createAdsTable() {
    try {
        console.log('🔄 Creating advertisements table...');
        
        const migrationSQL = `
-- Create advertisements table for Nigerian business ads
CREATE TABLE IF NOT EXISTS advertisements (
    id BIGSERIAL PRIMARY KEY,
    
    -- Basic ad information
    title VARCHAR(255) NOT NULL,
    description TEXT,
    business_name VARCHAR(255) NOT NULL,
    business_category VARCHAR(100),
    
    -- Images and media
    image_url TEXT NOT NULL,
    logo_url TEXT,
    
    -- Links and contact
    website_url TEXT,
    instagram_url TEXT,
    whatsapp_phone VARCHAR(50),
    phone VARCHAR(50),
    email VARCHAR(255),
    
    -- Location targeting
    target_countries TEXT[], -- ['Nigeria', 'UK', 'US']
    target_cities TEXT[], -- ['Lagos', 'London', 'New York']
    
    -- Ad configuration
    ad_type VARCHAR(50) DEFAULT 'banner', -- banner, sidebar, sponsored
    position VARCHAR(50) DEFAULT 'sidebar', -- sidebar, header, footer, inline
    priority INTEGER DEFAULT 1, -- higher number = higher priority
    
    -- Campaign settings
    status VARCHAR(20) DEFAULT 'active', -- active, paused, expired
    start_date TIMESTAMP DEFAULT NOW(),
    end_date TIMESTAMP,
    budget_daily DECIMAL(10,2),
    cost_per_click DECIMAL(10,2),
    
    -- Performance tracking
    impressions BIGINT DEFAULT 0,
    clicks BIGINT DEFAULT 0,
    conversions BIGINT DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by BIGINT -- reference to admin user
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ads_status ON advertisements (status);
CREATE INDEX IF NOT EXISTS idx_ads_category ON advertisements (business_category);
CREATE INDEX IF NOT EXISTS idx_ads_priority ON advertisements (priority DESC);
CREATE INDEX IF NOT EXISTS idx_ads_dates ON advertisements (start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_ads_target_countries ON advertisements USING GIN (target_countries);
CREATE INDEX IF NOT EXISTS idx_ads_target_cities ON advertisements USING GIN (target_cities);
CREATE INDEX IF NOT EXISTS idx_ads_position ON advertisements (position);

-- Create ad clicks tracking table
CREATE TABLE IF NOT EXISTS ad_clicks (
    id BIGSERIAL PRIMARY KEY,
    ad_id BIGINT NOT NULL REFERENCES advertisements(id) ON DELETE CASCADE,
    ip_address INET,
    user_agent TEXT,
    referrer TEXT,
    clicked_at TIMESTAMP DEFAULT NOW(),
    country VARCHAR(100),
    city VARCHAR(100)
);

-- Create index for ad clicks
CREATE INDEX IF NOT EXISTS idx_ad_clicks_ad_id ON ad_clicks (ad_id);
CREATE INDEX IF NOT EXISTS idx_ad_clicks_date ON ad_clicks (clicked_at);
        `;
        
        await pool.query(migrationSQL);
        
        console.log('✅ Advertisements table created successfully!');
        
        // Verify tables were created
        const result = await pool.query(`
            SELECT table_name FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('advertisements', 'ad_clicks')
            ORDER BY table_name
        `);
        
        console.log('📊 Created tables:', result.rows.map(r => r.table_name));
        
    } catch (error) {
        console.error('❌ Failed to create advertisements table:', error);
    } finally {
        await pool.end();
        process.exit(0);
    }
}

if (require.main === module) {
    createAdsTable();
}

module.exports = { createAdsTable };