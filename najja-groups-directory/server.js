const express = require('express');
const path = require('path');
const session = require('express-session');
require ('dotenv').config(); // Load environment variables from .env file
const app = express();
const PORT = process.env.PORT || 3000;

//set ejs as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

//serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

//middleware to parse JSON and urlencoded data
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Session configuration for admin authentication
app.use(session({
    secret: process.env.SESSION_SECRET || 'najja-groups-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

//import routes
const indexRoutes = require('./routes/index');
const adminRoutes = require('./routes/admin');

//use routes
app.use('/', indexRoutes);
app.use('/admin', adminRoutes);

//basic test route to ensure server is running
app.get('/test', (req, res) => {
  res.send('server is running');
});
//start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
