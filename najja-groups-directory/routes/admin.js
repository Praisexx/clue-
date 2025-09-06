const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { requireAdmin, redirectIfLoggedIn } = require('../middleware/adminAuth');

// Login routes (public)
router.get('/login', redirectIfLoggedIn, adminController.getLoginPage);
router.post('/login', redirectIfLoggedIn, adminController.login);

// Protected admin routes
router.get('/dashboard', requireAdmin, adminController.getDashboard);
router.get('/manage-groups', requireAdmin, adminController.getManageGroups);

// Group management actions
router.post('/groups/:id/approve', requireAdmin, adminController.approveGroup);
router.post('/groups/:id/reject', requireAdmin, adminController.rejectGroup);
router.post('/groups/:id/delete', requireAdmin, adminController.deleteGroup);
router.post('/groups/:id/featured', requireAdmin, adminController.toggleFeatured);

// Logout
router.get('/logout', adminController.logout);

// Redirect /admin to dashboard
router.get('/', requireAdmin, (req, res) => {
    res.redirect('/admin/dashboard');
});

module.exports = router;