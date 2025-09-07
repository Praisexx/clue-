const db = require('../config/database'); // Adjust path as needed

class Group {
    static async getBySlug(slug) {
        try {
            console.log('🔍 Group.getBySlug called with slug:', slug);
            
            const result = await db.query(
                `SELECT 
                    id, slug, name, description, address,
                    city, region, country, phone, email, website,
                    categories, founded_year, member_size, membership_type,
                    meeting_days, featured, logo_url, created_at
                 FROM groups 
                 WHERE slug = $1`,
                [slug]
            );
            
            console.log('📊 Query result rows:', result.rows.length);
            
            if (result.rows.length === 0) {
                console.log('❌ No group found');
                return null;
            }
            
            const group = result.rows[0];
            console.log('✅ Group found:', group.name);
            console.log('🖼️  Logo URL in model:', group.logo_url);
            console.log('📋 All group fields:', Object.keys(group));
            
            return group;
        } catch (error) {
            console.error('❌ Error in getBySlug:', error.message);
            throw new Error('Error fetching group by slug: ' + error.message);
        }
    }

    static async getFeaturedGroups() {
        try {
            const result = await db.query(
                `SELECT 
                    id, slug, name, description, 
                    city, country, categories, featured, logo_url
                 FROM groups 
                 WHERE featured = true
                 ORDER BY id DESC 
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
                    city, country, categories, featured
                 FROM groups 
                 WHERE 1=1
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
                    city, country, categories, featured
                 FROM groups 
                 WHERE 1=1 AND (
                    name ILIKE $1 
                    OR description ILIKE $1 
                    OR categories::text ILIKE $1
                 )
                 ORDER BY name ASC`,
                [`%${searchTerm}%`]
            );
            
            return result.rows;
        } catch (error) {
            throw new Error('Error searching groups: ' + error.message);
        }
    }

    static async createGroup(groupData) {
        try {
            const result = await db.query(
                `INSERT INTO groups (
                    slug, name, description, city, country, address,
                    email, phone, website, categories, founded_year,
                    member_size, membership_type, meeting_days, featured,
                    status, lat, lng, logo_url
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
                RETURNING id, slug`,
                [
                    groupData.slug,
                    groupData.name,
                    groupData.description,
                    groupData.city,
                    groupData.country,
                    groupData.address,
                    groupData.email,
                    groupData.phone,
                    groupData.website,
                    groupData.categories,
                    groupData.founded_year,
                    groupData.member_size,
                    groupData.membership_type,
                    groupData.meeting_days,
                    groupData.featured,
                    groupData.status,
                    groupData.lat,
                    groupData.lng,
                    groupData.logo_url
                ]
            );
            
            return result.rows[0];
        } catch (error) {
            throw error; // Pass through the original error for better handling
        }
    }

    static async searchGroupsNearby(userLat, userLng, radiusKm = 25, searchTerm = '') {
        try {
            // Calculate distance using Haversine formula in SQL
            // 6371 is Earth's radius in kilometers
            let query = `
                SELECT 
                    id, slug, name, description, 
                    city, country, categories, featured, lat, lng,
                    (6371 * acos(
                        cos(radians($1)) * cos(radians(lat)) *
                        cos(radians(lng) - radians($2)) +
                        sin(radians($1)) * sin(radians(lat))
                    )) AS distance
                FROM groups 
                WHERE status = 'approved'
                    AND lat IS NOT NULL 
                    AND lng IS NOT NULL
                    AND (6371 * acos(
                        cos(radians($1)) * cos(radians(lat)) *
                        cos(radians(lng) - radians($2)) +
                        sin(radians($1)) * sin(radians(lat))
                    )) <= $3
            `;
            
            let params = [userLat, userLng, radiusKm];
            
            // Add text search if provided
            if (searchTerm.trim()) {
                query += ` AND (name ILIKE $4 OR description ILIKE $4 OR categories::text ILIKE $4)`;
                params.push(`%${searchTerm}%`);
            }
            
            query += ` ORDER BY distance ASC`;
            
            const result = await db.query(query, params);
            
            // Round distance to 1 decimal place
            return result.rows.map(group => ({
                ...group,
                distance: Math.round(group.distance * 10) / 10
            }));
            
        } catch (error) {
            throw new Error('Error searching nearby groups: ' + error.message);
        }
    }

    static async getAllGroupsWithDistance(userLat, userLng) {
        try {
            const result = await db.query(
                `SELECT 
                    id, slug, name, description, 
                    city, country, categories, featured, lat, lng,
                    CASE 
                        WHEN lat IS NOT NULL AND lng IS NOT NULL THEN
                            (6371 * acos(
                                cos(radians($1)) * cos(radians(lat)) *
                                cos(radians(lng) - radians($2)) +
                                sin(radians($1)) * sin(radians(lat))
                            ))
                        ELSE NULL
                    END AS distance
                 FROM groups 
                 WHERE 1=1
                 ORDER BY distance ASC NULLS LAST, name ASC`,
                [userLat, userLng]
            );
            
            return result.rows.map(group => ({
                ...group,
                distance: group.distance ? Math.round(group.distance * 10) / 10 : null
            }));
        } catch (error) {
            throw new Error('Error fetching groups with distance: ' + error.message);
        }
    }
}

module.exports = Group;