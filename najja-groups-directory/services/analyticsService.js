const db = require('../config/database');
const crypto = require('crypto');

// Generate a session ID for tracking unique views
function generateSessionId() {
    return crypto.randomBytes(16).toString('hex');
}

// Get or create session ID from request/response
function getSessionId(req, res) {
    let sessionId = req.headers['x-session-id'] || req.cookies?.session_id;
    
    if (!sessionId) {
        sessionId = generateSessionId();
        // Set session cookie for 24 hours
        if (res) {
            res.cookie('session_id', sessionId, {
                maxAge: 24 * 60 * 60 * 1000, // 24 hours
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production'
            });
        }
    }
    
    return sessionId;
}

// Get client information from request
function getClientInfo(req) {
    const clientIP = req.headers['x-forwarded-for'] || 
                    req.connection.remoteAddress || 
                    req.socket.remoteAddress ||
                    (req.connection.socket ? req.connection.socket.remoteAddress : null);
    
    const userAgent = req.headers['user-agent'] || null;
    const referrer = req.headers['referer'] || req.headers['referrer'] || null;
    
    return { clientIP, userAgent, referrer };
}

class AnalyticsService {
    // Track a page view
    static async trackView(groupId, req, res) {
        try {
            const sessionId = getSessionId(req, res);
            const { clientIP, userAgent, referrer } = getClientInfo(req);
            
            // Check if this is a unique view (same IP + session within last hour)
            const recentView = await db.query(
                `SELECT id FROM group_views 
                 WHERE group_id = $1 AND ip_address = $2 AND session_id = $3 
                 AND viewed_at > NOW() - INTERVAL '1 hour'
                 LIMIT 1`,
                [groupId, clientIP, sessionId]
            );
            
            // Only track if not a recent duplicate
            if (recentView.rows.length === 0) {
                // Insert view record
                await db.query(
                    `INSERT INTO group_views (group_id, ip_address, user_agent, referrer, session_id)
                     VALUES ($1, $2, $3, $4, $5)`,
                    [groupId, clientIP, userAgent, referrer, sessionId]
                );
                
                // Update cached view count on groups table
                await db.query(
                    `UPDATE groups 
                     SET total_views = COALESCE(total_views, 0) + 1,
                         last_viewed_at = NOW()
                     WHERE id = $1`,
                    [groupId]
                );
                
                console.log(`📊 View tracked for group ${groupId} from ${clientIP}`);
            }
            
            return sessionId;
        } catch (error) {
            console.error('Error tracking view:', error);
            // Don't throw - analytics should not break the main flow
        }
    }
    
    // Track a click on contact method or link
    static async trackClick(groupId, clickType, targetUrl, req, res) {
        try {
            const sessionId = getSessionId(req, res);
            const { clientIP, userAgent } = getClientInfo(req);
            
            // Insert click record
            await db.query(
                `INSERT INTO group_clicks (group_id, click_type, target_url, ip_address, user_agent, session_id)
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [groupId, clickType, targetUrl, clientIP, userAgent, sessionId]
            );
            
            // Update cached click count on groups table
            await db.query(
                `UPDATE groups 
                 SET total_clicks = COALESCE(total_clicks, 0) + 1
                 WHERE id = $1`,
                [groupId]
            );
            
            console.log(`🖱️ Click tracked: ${clickType} for group ${groupId} from ${clientIP}`);
            
        } catch (error) {
            console.error('Error tracking click:', error);
            // Don't throw - analytics should not break the main flow
        }
    }
    
    // Get analytics summary for a group
    static async getGroupAnalytics(groupId, days = 30) {
        try {
            const endDate = new Date();
            const startDate = new Date(endDate.getTime() - (days * 24 * 60 * 60 * 1000));
            
            // Get daily view counts
            const viewsResult = await db.query(
                `SELECT 
                    DATE(viewed_at) as date,
                    COUNT(*) as total_views,
                    COUNT(DISTINCT CONCAT(ip_address, session_id)) as unique_views
                 FROM group_views 
                 WHERE group_id = $1 AND viewed_at >= $2
                 GROUP BY DATE(viewed_at)
                 ORDER BY date DESC`,
                [groupId, startDate]
            );
            
            // Get click breakdown
            const clicksResult = await db.query(
                `SELECT 
                    click_type,
                    COUNT(*) as clicks
                 FROM group_clicks 
                 WHERE group_id = $1 AND clicked_at >= $2
                 GROUP BY click_type`,
                [groupId, startDate]
            );
            
            // Get total counts
            const totalResult = await db.query(
                `SELECT 
                    (SELECT COALESCE(total_views, 0) FROM groups WHERE id = $1) as total_views,
                    (SELECT COALESCE(total_clicks, 0) FROM groups WHERE id = $1) as total_clicks,
                    (SELECT COUNT(*) FROM group_views WHERE group_id = $1 AND viewed_at >= $2) as recent_views,
                    (SELECT COUNT(*) FROM group_clicks WHERE group_id = $1 AND clicked_at >= $2) as recent_clicks
                `,
                [groupId, startDate]
            );
            
            return {
                period: { days, startDate, endDate },
                totals: totalResult.rows[0] || {},
                dailyViews: viewsResult.rows || [],
                clickBreakdown: clicksResult.rows || []
            };
            
        } catch (error) {
            console.error('Error getting group analytics:', error);
            return {
                period: { days, startDate: new Date(), endDate: new Date() },
                totals: { total_views: 0, total_clicks: 0, recent_views: 0, recent_clicks: 0 },
                dailyViews: [],
                clickBreakdown: []
            };
        }
    }
    
    // Get top performing groups
    static async getTopGroups(limit = 10, metric = 'views') {
        try {
            const orderColumn = metric === 'clicks' ? 'total_clicks' : 'total_views';
            
            const result = await db.query(
                `SELECT 
                    id, slug, name, city, country, 
                    total_views, total_clicks, last_viewed_at,
                    categories
                 FROM groups 
                 WHERE ${orderColumn} > 0
                 ORDER BY ${orderColumn} DESC, name ASC
                 LIMIT $1`,
                [limit]
            );
            
            return result.rows || [];
            
        } catch (error) {
            console.error('Error getting top groups:', error);
            return [];
        }
    }
    
    // Update daily analytics summary (run as cron job)
    static async updateDailySummary(date = new Date()) {
        try {
            const targetDate = new Date(date);
            targetDate.setHours(0, 0, 0, 0);
            const nextDay = new Date(targetDate.getTime() + 24 * 60 * 60 * 1000);
            
            // Get all groups that had activity on this date
            const groupsWithActivity = await db.query(
                `SELECT DISTINCT group_id 
                 FROM (
                    SELECT group_id FROM group_views WHERE viewed_at >= $1 AND viewed_at < $2
                    UNION
                    SELECT group_id FROM group_clicks WHERE clicked_at >= $1 AND clicked_at < $2
                 ) as activity`,
                [targetDate, nextDay]
            );
            
            for (const { group_id } of groupsWithActivity.rows) {
                // Calculate daily stats
                const stats = await db.query(
                    `SELECT 
                        (SELECT COUNT(*) FROM group_views 
                         WHERE group_id = $1 AND viewed_at >= $2 AND viewed_at < $3) as total_views,
                        (SELECT COUNT(DISTINCT CONCAT(ip_address, session_id)) FROM group_views 
                         WHERE group_id = $1 AND viewed_at >= $2 AND viewed_at < $3) as unique_views,
                        (SELECT COUNT(*) FROM group_clicks 
                         WHERE group_id = $1 AND click_type = 'phone' AND clicked_at >= $2 AND clicked_at < $3) as phone_clicks,
                        (SELECT COUNT(*) FROM group_clicks 
                         WHERE group_id = $1 AND click_type = 'email' AND clicked_at >= $2 AND clicked_at < $3) as email_clicks,
                        (SELECT COUNT(*) FROM group_clicks 
                         WHERE group_id = $1 AND click_type = 'website' AND clicked_at >= $2 AND clicked_at < $3) as website_clicks,
                        (SELECT COUNT(*) FROM group_clicks 
                         WHERE group_id = $1 AND click_type = 'whatsapp' AND clicked_at >= $2 AND clicked_at < $3) as whatsapp_clicks,
                        (SELECT COUNT(*) FROM group_clicks 
                         WHERE group_id = $1 AND click_type IN ('facebook', 'instagram', 'twitter', 'linkedin', 'youtube') 
                         AND clicked_at >= $2 AND clicked_at < $3) as social_clicks
                    `,
                    [group_id, targetDate, nextDay]
                );
                
                const dailyStats = stats.rows[0];
                
                // Insert or update daily summary
                await db.query(
                    `INSERT INTO group_analytics_summary 
                        (group_id, date, total_views, unique_views, phone_clicks, email_clicks, website_clicks, whatsapp_clicks, social_clicks)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                     ON CONFLICT (group_id, date) DO UPDATE SET
                        total_views = EXCLUDED.total_views,
                        unique_views = EXCLUDED.unique_views,
                        phone_clicks = EXCLUDED.phone_clicks,
                        email_clicks = EXCLUDED.email_clicks,
                        website_clicks = EXCLUDED.website_clicks,
                        whatsapp_clicks = EXCLUDED.whatsapp_clicks,
                        social_clicks = EXCLUDED.social_clicks,
                        updated_at = NOW()`,
                    [
                        group_id, 
                        targetDate.toISOString().split('T')[0],
                        dailyStats.total_views,
                        dailyStats.unique_views,
                        dailyStats.phone_clicks,
                        dailyStats.email_clicks,
                        dailyStats.website_clicks,
                        dailyStats.whatsapp_clicks,
                        dailyStats.social_clicks
                    ]
                );
            }
            
            console.log(`📈 Daily analytics summary updated for ${targetDate.toISOString().split('T')[0]}`);
            
        } catch (error) {
            console.error('Error updating daily analytics summary:', error);
        }
    }
}

module.exports = AnalyticsService;