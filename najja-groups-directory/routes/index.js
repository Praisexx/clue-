// routes/index.js
const express = require('express');
const router = express.Router(); // Use Express's built-in Router
const indexController = require('../controllers/indexController');

// GET homepage
router.get('/', indexController.getHomepage);

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

module.exports = router;