// routes/index.js
const express = require('express');
const router = express.Router(); // Use Express's built-in Router
const indexController = require('../controllers/indexController');
const searchController = require('../controllers/searchController');
const groupController = require('../controllers/groupController');
const addGroupController = require('../controllers/addGroupController');
const aboutController = require('../controllers/aboutController');
const contactController = require('../controllers/contactController');
const { upload, processGroupLogo } = require('../middleware/upload');

// GET homepage
router.get('/', indexController.getHomepage);

// Search routes
router.get('/search', searchController.searchGroups);

// Group profile routes
router.get('/groups/:slug', groupController.getGroupBySlug);

// Add Group routes
router.get('/add-group', addGroupController.getAddGroupForm);
router.post('/add-group', upload.single('logo'), processGroupLogo, addGroupController.submitGroup);

// About and Contact routes
router.get('/about', aboutController.getAboutPage);
router.get('/contact', contactController.getContactPage);
router.post('/contact', contactController.submitContactForm);

// API Routes
router.post('/api/contact', contactController.submitContactMessage);

// Search suggestion API routes
router.get('/api/search/suggestions', searchController.getSearchSuggestions);
router.get('/api/search/categories', searchController.getCategorySuggestions);
router.get('/api/search/locations', searchController.getLocationSuggestions);

// Analytics API routes
const AnalyticsService = require('../services/analyticsService');
router.post('/api/track/click', async (req, res) => {
    try {
        const { groupId, clickType, targetUrl } = req.body;
        
        if (!groupId || !clickType) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        // Track the click (async)
        AnalyticsService.trackClick(groupId, clickType, targetUrl, req, res);
        
        res.json({ success: true });
    } catch (error) {
        console.error('Click tracking error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// SEO Routes
const SitemapService = require('../services/sitemapService');

// XML Sitemap
router.get('/sitemap.xml', async (req, res) => {
    try {
        const sitemap = await SitemapService.generateSitemap();
        res.set('Content-Type', 'text/xml');
        res.send(sitemap);
    } catch (error) {
        console.error('Error generating sitemap:', error);
        res.status(500).send('Error generating sitemap');
    }
});

// Robots.txt
router.get('/robots.txt', async (req, res) => {
    try {
        const robotsTxt = await SitemapService.generateRobotsTxt();
        res.set('Content-Type', 'text/plain');
        res.send(robotsTxt);
    } catch (error) {
        console.error('Error generating robots.txt:', error);
        res.status(500).send('Error generating robots.txt');
    }
});

// News Sitemap (optional)
router.get('/news-sitemap.xml', async (req, res) => {
    try {
        const newsSitemap = await SitemapService.generateNewsSitemap();
        res.set('Content-Type', 'text/xml');
        res.send(newsSitemap);
    } catch (error) {
        console.error('Error generating news sitemap:', error);
        res.status(500).send('Error generating news sitemap');
    }
});


// Simple database test route
router.get('/test-db', async (req, res) => {
  try {
    const pool = require('../config/database');
    const result = await pool.query('SELECT NOW() as current_time');
    res.send(`Database connection successful! Time: ${result.rows[0].current_time}`);
  } catch (error) {
    res.status(500).send('Database connection failed: ' + error.message);
  }
});

// Debug route to test group data
router.get('/debug-group/:slug', async (req, res) => {
  try {
    const Group = require('../models/Group');
    const group = await Group.getBySlug(req.params.slug);
    
    res.json({
      slug: req.params.slug,
      found: !!group,
      group: group,
      logo_url: group ? group.logo_url : null,
      logo_exists: group && !!group.logo_url
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;