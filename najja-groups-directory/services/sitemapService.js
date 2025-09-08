const Group = require('../models/Group');

class SitemapService {
    static async generateSitemap() {
        try {
            const baseUrl = process.env.SITE_URL || 'http://localhost:3000';
            const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
            
            // Get all approved groups
            const groups = await Group.getAllGroups();
            
            let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <!-- Static Pages -->
    <url>
        <loc>${baseUrl}</loc>
        <lastmod>${currentDate}</lastmod>
        <changefreq>daily</changefreq>
        <priority>1.0</priority>
    </url>
    <url>
        <loc>${baseUrl}/search</loc>
        <lastmod>${currentDate}</lastmod>
        <changefreq>daily</changefreq>
        <priority>0.8</priority>
    </url>
    <url>
        <loc>${baseUrl}/add-group</loc>
        <lastmod>${currentDate}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.6</priority>
    </url>
    <url>
        <loc>${baseUrl}/about</loc>
        <lastmod>${currentDate}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.5</priority>
    </url>
    <url>
        <loc>${baseUrl}/contact</loc>
        <lastmod>${currentDate}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.4</priority>
    </url>
    
    <!-- Group Pages -->`;

            // Add each group to sitemap
            for (const group of groups) {
                const lastmod = group.updated_at ? 
                    new Date(group.updated_at).toISOString().split('T')[0] : 
                    currentDate;
                
                // Calculate priority based on featured status and total views
                let priority = 0.7;
                if (group.featured) priority += 0.1;
                if (group.total_views > 100) priority += 0.1;
                if (group.total_views > 500) priority += 0.1;
                priority = Math.min(priority, 0.9); // Cap at 0.9
                
                sitemap += `
    <url>
        <loc>${baseUrl}/groups/${group.slug}</loc>
        <lastmod>${lastmod}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>${priority.toFixed(1)}</priority>
    </url>`;
            }
            
            sitemap += `
</urlset>`;
            
            return sitemap;
            
        } catch (error) {
            console.error('Error generating sitemap:', error);
            throw error;
        }
    }
    
    static async generateRobotsTxt() {
        const baseUrl = process.env.SITE_URL || 'http://localhost:3000';
        
        return `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /test-db
Disallow: /debug-group/

# Sitemap location
Sitemap: ${baseUrl}/sitemap.xml

# Crawl-delay for politeness
Crawl-delay: 1`;
    }
    
    // Generate category-specific sitemaps for large directories
    static async generateCategorySitemaps() {
        try {
            const categories = await Group.getAllCategories();
            const baseUrl = process.env.SITE_URL || 'http://localhost:3000';
            const currentDate = new Date().toISOString().split('T')[0];
            
            const categorySitemaps = {};
            
            for (const category of categories) {
                const categorySlug = category.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
                
                let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <!-- Category Search Page -->
    <url>
        <loc>${baseUrl}/search?category=${encodeURIComponent(category)}</loc>
        <lastmod>${currentDate}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.6</priority>
    </url>
</urlset>`;
                
                categorySitemaps[categorySlug] = sitemap;
            }
            
            return categorySitemaps;
            
        } catch (error) {
            console.error('Error generating category sitemaps:', error);
            return {};
        }
    }
    
    // Generate news/blog sitemap for NGEX feed if needed
    static async generateNewsSitemap() {
        const baseUrl = process.env.SITE_URL || 'http://localhost:3000';
        const currentDate = new Date().toISOString();
        
        return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
    <!-- News/Updates would go here if we had a blog/news section -->
    <!-- For now, we'll include the homepage with news feed -->
    <url>
        <loc>${baseUrl}</loc>
        <news:news>
            <news:publication>
                <news:name>Naija Groups Directory</news:name>
                <news:language>en</news:language>
            </news:publication>
            <news:publication_date>${currentDate}</news:publication_date>
            <news:title>Nigerian Diaspora Groups Directory - Latest Updates</news:title>
        </news:news>
        <lastmod>${currentDate.split('T')[0]}</lastmod>
        <changefreq>daily</changefreq>
        <priority>0.9</priority>
    </url>
</urlset>`;
    }
}

module.exports = SitemapService;