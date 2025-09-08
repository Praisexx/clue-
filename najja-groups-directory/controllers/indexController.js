// controllers/indexController.js
const Group = require('../models/Group');
const newsService = require('../services/newsService');

exports.getHomepage = async (req, res) => {
  try {
    // Fetch featured groups and news in parallel
    const [featuredGroups, newsArticles] = await Promise.all([
      Group.getFeaturedGroups(),
      newsService.fetchNews(4) // Get 4 latest news articles
    ]);

    // Log the data to check if it's correct
    console.log("Fetched featured groups:", featuredGroups.length);
    console.log("Fetched news articles:", newsArticles.length);

    // Render the index page and pass the data
    res.render('index', {
      title: 'Naija Groups - Nigerian Diaspora Directory',
      description: 'Find and connect with Nigerian diaspora groups worldwide. Discover communities, organizations, and cultural groups in your area.',
      featuredGroups: featuredGroups,
      newsArticles: newsArticles
    });
  } catch (error) {
    console.error('Error fetching homepage data:', error);
    res.status(500).render('error', { error: 'Unable to load homepage' });
  }
};