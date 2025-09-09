const Admin = require('../models/Admin');

// Show admin login page
exports.getLoginPage = (req, res) => {
    res.render('admin/login', {
        title: 'Admin Login - Naija Groups',
        error: null
    });
};

// Handle admin login
exports.login = async (req, res) => {
    try {
        console.log('🔍 Login attempt:', { username: req.body.username });
        const { username, password } = req.body;
        
        if (!username || !password) {
            console.log('❌ Missing credentials');
            return res.render('admin/login', {
                title: 'Admin Login - Naija Groups',
                error: 'Username/Email and password are required'
            });
        }
        
        const admin = await Admin.authenticate(username, password);
        console.log('🔐 Authentication result:', admin ? 'SUCCESS' : 'FAILED');
        
        if (admin) {
            req.session.admin = admin;
            console.log('✅ Session set, redirecting to dashboard');
            res.redirect('/admin/dashboard');
        } else {
            console.log('❌ Invalid credentials');
            res.render('admin/login', {
                title: 'Admin Login - Naija Groups',
                error: 'Invalid username/email or password'
            });
        }
    } catch (error) {
        console.error('❌ Login error:', error);
        res.render('admin/login', {
            title: 'Admin Login - Naija Groups',
            error: 'Login failed. Please try again.'
        });
    }
};

// Admin dashboard
exports.getDashboard = async (req, res) => {
    try {
        console.log('📊 Dashboard access attempt');
        console.log('🔑 Session admin:', req.session.admin ? 'EXISTS' : 'MISSING');
        
        if (!req.session.admin) {
            console.log('❌ No admin session, redirecting to login');
            return res.redirect('/admin/login');
        }
        
        console.log('✅ Loading dashboard data...');
        const pendingGroups = await Admin.getPendingGroups();
        const allGroups = await Admin.getAllGroups();
        const approvedGroups = allGroups.filter(group => group.status === 'approved');
        const rejectedGroups = allGroups.filter(group => group.status === 'rejected');
        
        res.render('admin/dashboard', {
            title: 'Admin Dashboard - Naija Groups',
            admin: req.session.admin,
            stats: {
                pending: pendingGroups.length,
                approved: approvedGroups.length,
                rejected: rejectedGroups.length,
                total: allGroups.length
            },
            pendingGroups: pendingGroups.slice(0, 5) // Show first 5 pending
        });
    } catch (error) {
        console.error('❌ Dashboard error:', error);
        res.status(500).render('error', {
            title: 'Dashboard Error',
            error: 'Unable to load dashboard'
        });
    }
};

// Manage groups page
exports.getManageGroups = async (req, res) => {
    try {
        const status = req.query.status || 'all';
        const groups = status === 'all' ? 
            await Admin.getAllGroups() : 
            await Admin.getAllGroups(status);
        
        res.render('admin/manage-groups', {
            title: 'Manage Groups - Admin',
            admin: req.session.admin,
            groups: groups,
            currentStatus: status
        });
    } catch (error) {
        console.error('Manage groups error:', error);
        res.status(500).render('error', {
            title: 'Error',
            error: 'Unable to load groups'
        });
    }
};

// Approve group
exports.approveGroup = async (req, res) => {
    try {
        const groupId = parseInt(req.params.id);
        const adminId = req.session.admin.id;
        
        await Admin.approveGroup(groupId, adminId);
        
        res.redirect('/admin/manage-groups?status=pending');
    } catch (error) {
        console.error('Approve group error:', error);
        res.status(500).json({ error: 'Failed to approve group' });
    }
};

// Reject group
exports.rejectGroup = async (req, res) => {
    try {
        const groupId = parseInt(req.params.id);
        const { reason } = req.body;
        
        await Admin.rejectGroup(groupId, reason || 'No reason provided');
        
        res.redirect('/admin/manage-groups?status=pending');
    } catch (error) {
        console.error('Reject group error:', error);
        res.status(500).json({ error: 'Failed to reject group' });
    }
};

// Delete group
exports.deleteGroup = async (req, res) => {
    try {
        const groupId = parseInt(req.params.id);
        
        await Admin.deleteGroup(groupId);
        
        res.redirect('/admin/manage-groups');
    } catch (error) {
        console.error('Delete group error:', error);
        res.status(500).json({ error: 'Failed to delete group' });
    }
};

// Toggle featured status
exports.toggleFeatured = async (req, res) => {
    try {
        const groupId = parseInt(req.params.id);
        
        const updatedGroup = await Admin.toggleFeatured(groupId);
        
        res.json({ 
            success: true, 
            featured: updatedGroup.featured 
        });
    } catch (error) {
        console.error('Toggle featured error:', error);
        res.status(500).json({ error: 'Failed to toggle featured status' });
    }
};

// Admin logout
exports.logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Logout error:', err);
        }
        res.redirect('/admin/login');
    });
};

module.exports = exports;