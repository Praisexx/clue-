const express = require('express');
const path = require('path');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
require('dotenv').config(); 

// Import database connection pool
const pool = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3000;

// Set EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Middleware to parse JSON and URL-encoded data
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Session configuration (PostgreSQL store)
app.use(session({
    store: new pgSession({
        pool: pool,             // Reuse existing database pool
        tableName: 'session'    // Table you migrated with session.sql
    }),
    secret: process.env.SESSION_SECRET || 'najja-groups-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Import routes
const indexRoutes = require('./routes/index');
const adminRoutes = require('./routes/admin');

// Use routes
app.use('/', indexRoutes);
app.use('/admin', adminRoutes);

// Basic test route
app.get('/test', (req, res) => {
    res.send('server is running');
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
