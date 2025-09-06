const db = require('../config/database'); // Adjust path as needed

class Group {
    static async getBySlug(slug) {
        try {
            const result = await db.query(
                `SELECT 
                    id, slug, name, description, 
                    address, city, region, country,
                    lat, lng, phone, email, website,
                    socials, meeting_days, founded_year,
                    member_size, membership_type, categories,
                    tags, featured, verified, views_count,
                    clicks_count, created_at, updated_at
                 FROM groups 
                 WHERE slug = $1`,
                [slug]
            );
            
            if (result.rows.length === 0) {
                return null;
            }
            
            return result.rows[0];
        } catch (error) {
            throw new Error('Error fetching group by slug: ' + error.message);
        }
    }

    static async getFeaturedGroups() {
        try {
            const result = await db.query(
                `SELECT 
                    id, slug, name, description, 
                    address, city, region, country,
                    lat, lng, phone, email, website,
                    socials, meeting_days, founded_year,
                    member_size, membership_type, categories,
                    tags, featured, verified, views_count,
                    clicks_count, created_at, updated_at
                 FROM groups 
                 WHERE featured = true 
                 ORDER BY created_at DESC 
                 LIMIT 6`
            );
            
            return result.rows;
        } catch (error) {
            throw new Error('Error fetching featured groups: ' + error.message);
        }
    }

    static async getAllGroups() {
        try {
            const result = await db.query(
                `SELECT 
                    id, slug, name, description, 
                    address, city, region, country,
                    lat, lng, phone, email, website,
                    socials, meeting_days, founded_year,
                    member_size, membership_type, categories,
                    tags, featured, verified, views_count,
                    clicks_count, created_at, updated_at
                 FROM groups 
                 ORDER BY name ASC`
            );
            
            return result.rows;
        } catch (error) {
            throw new Error('Error fetching all groups: ' + error.message);
        }
    }

    static async searchGroups(searchTerm) {
        try {
            const result = await db.query(
                `SELECT 
                    id, slug, name, description, 
                    address, city, region, country,
                    lat, lng, phone, email, website,
                    socials, meeting_days, founded_year,
                    member_size, membership_type, categories,
                    tags, featured, verified, views_count,
                    clicks_count, created_at, updated_at
                 FROM groups 
                 WHERE name ILIKE $1 
                    OR description ILIKE $1 
                    OR categories::text ILIKE $1 
                    OR tags::text ILIKE $1
                 ORDER BY name ASC`,
                [`%${searchTerm}%`]
            );
            
            return result.rows;
        } catch (error) {
            throw new Error('Error searching groups: ' + error.message);
        }
    }
}

module.exports = Group;