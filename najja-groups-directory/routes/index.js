// routes/index.js
const express = require('express');
const router = express.Router(); // Use Express's built-in Router
const indexController = require('../controllers/indexController');
const searchController = require('../controllers/searchController');
const groupController = require('../controllers/groupController');
const addGroupController = require('../controllers/addGroupController');
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