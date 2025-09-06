// controllers/indexController.js
// controllers/indexController.js
const Group = require('../models/Group'); // Import your Group model

exports.getHomepage = async (req, res) => {
  try {
    // Fetch featured groups from the database
    const featuredGroups = await Group.getFeaturedGroups(); // You need to implement this method

    // Log the data to check if it's correct
    console.log("Fetched featured groups:", featuredGroups);

    // Render the index page and pass the data
    res.render('index', {
      title: 'Naija Groups - Home',
      featuredGroups: featuredGroups // This must be an array of group objects
    });
  } catch (error) {
    console.error('Error fetching featured groups:', error);
    res.status(500).render('error', { error: 'Unable to load homepage' });
  }
};