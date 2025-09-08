const express = require('express');
const path = require('path');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session); // ✅ session store in Postgres
require('dotenv').config(); // Load environment variables

// Import database pool
const pool = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3000;

// Set EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files from "public"
app.use(express.static(path.join(__dirname, 'public')));

// Middleware to parse JSON and urlencoded data
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ✅ Session configuration with Postgres store
app.use(session({
    store: new pgSession({
        pool: pool,           // Reuse existing DB connection
        tableName: 'session', // Table name in DB
        createTableIfMissing: true // ✅ auto-create session table if it doesn't exist
    }),
    secret: process.env.SESSION_SECRET || 'najja-groups-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production', // true only in prod
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
