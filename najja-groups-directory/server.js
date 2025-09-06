const express = require('express');
const path = require('path');
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

//import routes
const indexRoutes = require('./routes/index');

//use routes
app.use('/', indexRoutes);

//basic test route to ensure server is running
app.get('/test', (req, res) => {
  res.send('server is running');
});
//start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
