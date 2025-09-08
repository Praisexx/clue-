const db = require('../config/database'); // Adjust path as needed

class Group {
    static async getBySlug(slug) {
        try {
            console.log('🔍 Group.getBySlug called with slug:', slug);
            
            const result = await db.query(
                `SELECT 
                    id, slug, name, description, address,
                    city, region, country, phone, email, website, whatsapp_phone,
                    categories, founded_year, member_size, membership_type,
                    meeting_days, featured, logo_url, created_at,
                    facebook_url, instagram_url, twitter_url, linkedin_url, youtube_url
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
                 LIMIT 3`
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
                    city, country, categories, featured, logo_url,
                    total_views, total_clicks, created_at, updated_at
                 FROM groups 
                 WHERE status = 'approved' OR status IS NULL
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
                    city, country, categories, featured, logo_url
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
                    email, phone, website, whatsapp_phone, categories, founded_year,
                    member_size, membership_type, meeting_days, featured,
                    status, lat, lng, logo_url, facebook_url, instagram_url, 
                    twitter_url, linkedin_url, youtube_url
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25)
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
                    groupData.whatsapp_phone,
                    groupData.categories,
                    groupData.founded_year,
                    groupData.member_size,
                    groupData.membership_type,
                    groupData.meeting_days,
                    groupData.featured,
                    groupData.status,
                    groupData.lat,
                    groupData.lng,
                    groupData.logo_url,
                    groupData.facebook_url,
                    groupData.instagram_url,
                    groupData.twitter_url,
                    groupData.linkedin_url,
                    groupData.youtube_url
                ]
            );
            
            return result.rows[0];
        } catch (error) {
            throw error; // Pass through the original error for better handling
        }
    }

    static async searchGroupsNearby(userLat, userLng, radiusKm = 25, searchTerm = '') {
        try {
            // Use PostGIS for more efficient geospatial queries
            let query = `
                SELECT 
                    id, slug, name, description, 
                    city, country, categories, featured, lat, lng, logo_url,
                    email, phone, whatsapp_phone, website, meeting_days, founded_year,
                    member_size, membership_type, verified, views_count,
                    ST_Distance(geom, ST_GeogFromText('POINT($2 $1)')) / 1000 AS distance
                FROM groups 
                WHERE (status = 'approved' OR status IS NULL)
                    AND geom IS NOT NULL
                    AND ST_DWithin(geom, ST_GeogFromText('POINT($2 $1)'), $3 * 1000)
            `;
            
            let params = [userLat, userLng, radiusKm];
            
            // Add text search if provided using full-text search
            if (searchTerm.trim()) {
                query += ` AND (search_vector @@ plainto_tsquery('english', $4) OR name ILIKE $5)`;
                params.push(searchTerm.trim(), `%${searchTerm}%`);
            }
            
            query += ` ORDER BY distance ASC, verified DESC, featured DESC`;
            
            const result = await db.query(query, params);
            
            // Round distance to 1 decimal place
            return result.rows.map(group => ({
                ...group,
                distance: Math.round(group.distance * 10) / 10
            }));
            
        } catch (error) {
            console.error('PostGIS search error:', error.message);
            // Fallback to Haversine formula if PostGIS fails
            return this.searchGroupsNearbyFallback(userLat, userLng, radiusKm, searchTerm);
        }
    }

    static async searchGroupsNearbyFallback(userLat, userLng, radiusKm = 25, searchTerm = '') {
        try {
            // Fallback using Haversine formula
            let query = `
                SELECT 
                    id, slug, name, description, 
                    city, country, categories, featured, lat, lng, logo_url,
                    email, phone, whatsapp_phone, website, meeting_days, founded_year,
                    member_size, membership_type, verified, views_count,
                    (6371 * acos(
                        cos(radians($1)) * cos(radians(lat)) *
                        cos(radians(lng) - radians($2)) +
                        sin(radians($1)) * sin(radians(lat))
                    )) AS distance
                FROM groups 
                WHERE (status = 'approved' OR status IS NULL)
                    AND lat IS NOT NULL 
                    AND lng IS NOT NULL
                    AND (6371 * acos(
                        cos(radians($1)) * cos(radians(lat)) *
                        cos(radians(lng) - radians($2)) +
                        sin(radians($1)) * sin(radians(lat))
                    )) <= $3
            `;
            
            let params = [userLat, userLng, radiusKm];
            
            if (searchTerm.trim()) {
                query += ` AND (name ILIKE $4 OR description ILIKE $4 OR categories::text ILIKE $4)`;
                params.push(`%${searchTerm}%`);
            }
            
            query += ` ORDER BY distance ASC, verified DESC, featured DESC`;
            
            const result = await db.query(query, params);
            
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
                    city, country, categories, featured, lat, lng, logo_url,
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

    static async searchGroupsExact(searchTerm) {
        try {
            if (!searchTerm.trim()) {
                return [];
            }
            
            // First, try exact name match
            let result = await db.query(
                `SELECT 
                    id, slug, name, description, 
                    city, country, categories, featured, lat, lng, logo_url,
                    email, phone, whatsapp_phone, website
                FROM groups 
                WHERE status != 'pending' 
                    AND LOWER(name) = LOWER($1)
                ORDER BY featured DESC, name ASC`,
                [searchTerm.trim()]
            );
            
            // If no exact match, try very close matches (Levenshtein distance)
            if (result.rows.length === 0) {
                result = await db.query(
                    `SELECT 
                        id, slug, name, description, 
                        city, country, categories, featured, lat, lng, logo_url,
                        email, phone, whatsapp_phone, website,
                        levenshtein(LOWER(name), LOWER($1)) as name_distance
                    FROM groups 
                    WHERE status != 'pending'
                        AND levenshtein(LOWER(name), LOWER($1)) <= 3
                    ORDER BY name_distance ASC, featured DESC, name ASC
                    LIMIT 10`,
                    [searchTerm.trim()]
                );
            }
            
            // If still no results, try partial matches
            if (result.rows.length === 0) {
                result = await db.query(
                    `SELECT 
                        id, slug, name, description, 
                        city, country, categories, featured, lat, lng, logo_url,
                        email, phone, whatsapp_phone, website
                    FROM groups 
                    WHERE status != 'pending'
                        AND (name ILIKE $1 OR description ILIKE $1)
                    ORDER BY 
                        CASE 
                            WHEN name ILIKE $1 THEN 1
                            WHEN description ILIKE $1 THEN 2
                            ELSE 3
                        END,
                        featured DESC, name ASC
                    LIMIT 10`,
                    [`%${searchTerm.trim()}%`]
                );
            }
            
            return result.rows;
            
        } catch (error) {
            // If levenshtein function is not available, fallback to basic search
            console.warn('Levenshtein function not available, using basic exact search');
            const result = await db.query(
                `SELECT 
                    id, slug, name, description, 
                    city, country, categories, featured, lat, lng, logo_url,
                    email, phone, whatsapp_phone, website
                FROM groups 
                WHERE status != 'pending'
                    AND (name ILIKE $1 OR name ILIKE $2)
                ORDER BY 
                    CASE 
                        WHEN LOWER(name) = LOWER($3) THEN 1
                        WHEN name ILIKE $1 THEN 2
                        ELSE 3
                    END,
                    featured DESC, name ASC
                LIMIT 10`,
                [searchTerm.trim(), `%${searchTerm.trim()}%`, searchTerm.trim()]
            );
            
            return result.rows;
        }
    }

    static async getAllCategories() {
        try {
            const result = await db.query(
                `SELECT DISTINCT unnest(categories) as category
                 FROM groups 
                 WHERE categories IS NOT NULL 
                   AND array_length(categories, 1) > 0
                 ORDER BY category ASC`
            );
            
            return result.rows.map(row => row.category);
        } catch (error) {
            console.warn('Error fetching categories:', error.message);
            return [];
        }
    }

    // Advanced search with multiple filters and sorting
    static async advancedSearch({
        query = '',
        category = '',
        meetingDay = '',
        membershipType = '',
        city = '',
        country = '',
        verified = null,
        featured = null,
        userLat = null,
        userLng = null,
        radiusKm = 50,
        sortBy = 'relevance',
        limit = 20,
        offset = 0
    } = {}) {
        try {
            // Build the base query without PostGIS for now to avoid parameter issues
            let whereConditions = [];
            let params = [];
            let paramIndex = 0;
            
            // Base conditions
            whereConditions.push('(status = $' + (++paramIndex) + ' OR status IS NULL)');
            params.push('approved');
            
            // Text search
            if (query.trim()) {
                whereConditions.push('(name ILIKE $' + (++paramIndex) + ' OR description ILIKE $' + (++paramIndex) + ')');
                params.push(`%${query}%`, `%${query}%`);
            }
            
            // Category filter
            if (category) {
                whereConditions.push('$' + (++paramIndex) + ' = ANY(categories)');
                params.push(category);
            }
            
            // Meeting day filter
            if (meetingDay) {
                whereConditions.push('$' + (++paramIndex) + ' = ANY(meeting_days)');
                params.push(meetingDay);
            }
            
            // Membership type filter
            if (membershipType) {
                whereConditions.push('membership_type = $' + (++paramIndex));
                params.push(membershipType);
            }
            
            // Location filters
            if (city) {
                whereConditions.push('city ILIKE $' + (++paramIndex));
                params.push(`%${city}%`);
            }
            
            if (country) {
                whereConditions.push('country ILIKE $' + (++paramIndex));
                params.push(`%${country}%`);
            }
            
            // Verified filter
            if (verified !== null) {
                whereConditions.push('verified = $' + (++paramIndex));
                params.push(verified);
            }
            
            // Featured filter
            if (featured !== null) {
                whereConditions.push('featured = $' + (++paramIndex));
                params.push(featured);
            }
            
            // Distance calculation (simplified)
            let selectFields = `
                id, slug, name, description, 
                city, country, categories, featured, lat, lng, logo_url,
                email, phone, whatsapp_phone, website, meeting_days, founded_year,
                member_size, membership_type, verified, views_count, created_at
            `;
            
            if (userLat && userLng) {
                selectFields += `, (
                    6371 * acos(
                        cos(radians($${++paramIndex})) * cos(radians(lat)) *
                        cos(radians(lng) - radians($${++paramIndex})) +
                        sin(radians($${++paramIndex})) * sin(radians(lat))
                    )
                ) AS distance`;
                params.push(userLat, userLng, userLat);
                
                // Add radius filter
                whereConditions.push(`(
                    lat IS NOT NULL AND lng IS NOT NULL AND
                    6371 * acos(
                        cos(radians($${++paramIndex})) * cos(radians(lat)) *
                        cos(radians(lng) - radians($${++paramIndex})) +
                        sin(radians($${++paramIndex})) * sin(radians(lat))
                    ) <= $${++paramIndex}
                )`);
                params.push(userLat, userLng, userLat, radiusKm);
            }
            
            let sql = `SELECT ${selectFields} FROM groups WHERE ${whereConditions.join(' AND ')}`;
            
            // Sorting
            let orderBy = '';
            switch (sortBy) {
                case 'distance':
                    orderBy = userLat && userLng ? 'distance ASC' : 'name ASC';
                    break;
                case 'newest':
                    orderBy = 'created_at DESC';
                    break;
                case 'oldest':
                    orderBy = 'created_at ASC';
                    break;
                case 'name':
                    orderBy = 'name ASC';
                    break;
                case 'views':
                    orderBy = 'views_count DESC NULLS LAST';
                    break;
                case 'relevance':
                default:
                    orderBy = 'featured DESC, verified DESC, views_count DESC NULLS LAST, name ASC';
                    break;
            }
            
            sql += ` ORDER BY ${orderBy}`;
            
            // Pagination
            sql += ` LIMIT $${++paramIndex} OFFSET $${++paramIndex}`;
            params.push(limit, offset);
            
            const result = await db.query(sql, params);
            
            return result.rows.map(group => ({
                ...group,
                distance: group.distance ? Math.round(group.distance * 10) / 10 : null
            }));
            
        } catch (error) {
            console.error('Advanced search error:', error);
            // Fallback to simple search
            return this.searchGroups(query || '');
        }
    }

    // Get search suggestions for autocomplete
    static async getSearchSuggestions(query, limit = 10) {
        try {
            if (!query.trim() || query.length < 2) return [];
            
            const result = await db.query(`
                SELECT DISTINCT name
                FROM groups 
                WHERE (status = 'approved' OR status IS NULL)
                    AND name ILIKE $1
                ORDER BY 
                    CASE 
                        WHEN name ILIKE $2 THEN 1  -- Starts with query
                        ELSE 2 
                    END,
                    char_length(name) ASC,
                    name ASC
                LIMIT $3
            `, [`%${query}%`, `${query}%`, limit]);
            
            return result.rows.map(row => row.name);
        } catch (error) {
            console.error('Error getting search suggestions:', error);
            return [];
        }
    }

    // Get category suggestions
    static async getCategorySuggestions(query = '', limit = 10) {
        try {
            let sql = `
                SELECT DISTINCT unnest(categories) as category,
                       COUNT(*) as group_count
                FROM groups 
                WHERE categories IS NOT NULL 
                  AND array_length(categories, 1) > 0
                  AND (status = 'approved' OR status IS NULL)
            `;
            let params = [limit];
            
            if (query.trim()) {
                sql += ` AND EXISTS (
                    SELECT 1 FROM unnest(categories) cat 
                    WHERE cat ILIKE $2
                )`;
                params.push(`%${query}%`);
            }
            
            sql += ` GROUP BY category ORDER BY group_count DESC, category ASC LIMIT $1`;
            
            const result = await db.query(sql, params);
            return result.rows;
        } catch (error) {
            console.error('Error getting category suggestions:', error);
            return [];
        }
    }

    // Gallery methods
    static async getGroupGallery(groupId) {
        try {
            const result = await db.query(
                `SELECT id, image_url, caption, display_order, created_at
                 FROM group_gallery 
                 WHERE group_id = $1 
                 ORDER BY display_order ASC, created_at ASC`,
                [groupId]
            );
            
            return result.rows;
        } catch (error) {
            console.warn('Error fetching group gallery:', error.message);
            return [];
        }
    }

    static async addGalleryImage(groupId, imageData) {
        try {
            const result = await db.query(
                `INSERT INTO group_gallery (group_id, image_url, caption, display_order)
                 VALUES ($1, $2, $3, $4)
                 RETURNING id, image_url, caption, display_order, created_at`,
                [groupId, imageData.image_url, imageData.caption || null, imageData.display_order || 0]
            );
            
            return result.rows[0];
        } catch (error) {
            throw new Error('Error adding gallery image: ' + error.message);
        }
    }

    static async removeGalleryImage(groupId, imageId) {
        try {
            const result = await db.query(
                'DELETE FROM group_gallery WHERE id = $1 AND group_id = $2 RETURNING id',
                [imageId, groupId]
            );
            
            return result.rows.length > 0;
        } catch (error) {
            throw new Error('Error removing gallery image: ' + error.message);
        }
    }

    static async updateGalleryOrder(groupId, imageOrders) {
        try {
            // imageOrders should be an array of {id, display_order}
            const promises = imageOrders.map(item => 
                db.query(
                    'UPDATE group_gallery SET display_order = $1 WHERE id = $2 AND group_id = $3',
                    [item.display_order, item.id, groupId]
                )
            );
            
            await Promise.all(promises);
            return true;
        } catch (error) {
            throw new Error('Error updating gallery order: ' + error.message);
        }
    }
}

module.exports = Group;