const express = require('express');
const path = require('path');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
require('dotenv').config();

const pool = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3000;

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Body parsing middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Session middleware with PostgreSQL store
app.use(session({
    store: new pgSession({
        pool: pool,
        tableName: 'session'
    }),
    secret: process.env.SESSION_SECRET || 'najja-groups-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // Allow HTTP for now
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000,
        sameSite: 'lax'
    }
}));

// Routes
const indexRoutes = require('./routes/index');
const adminRoutes = require('./routes/admin');

app.use('/', indexRoutes);
app.use('/admin', adminRoutes);

app.get('/test', (req, res) => {
    res.send('server is running');
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
