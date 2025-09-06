// Admin authentication middleware
function requireAdmin(req, res, next) {
    if (req.session && req.session.admin) {
        return next();
    } else {
        return res.redirect('/admin/login');
    }
}

// Check if user is already logged in
function redirectIfLoggedIn(req, res, next) {
    if (req.session && req.session.admin) {
        return res.redirect('/admin/dashboard');
    } else {
        return next();
    }
}

module.exports = {
    requireAdmin,
    redirectIfLoggedIn
};