const Group = require('../models/Group');

exports.searchGroups = async (req, res) => {
    try {
        const query = req.query.q || '';
        const category = req.query.category || '';
        const location = req.query.location || '';
        const userLat = req.query.lat ? parseFloat(req.query.lat) : null;
        const userLng = req.query.lng ? parseFloat(req.query.lng) : null;
        const radius = req.query.radius ? parseInt(req.query.radius) : 25;
        const nearMe = req.query.near_me === 'true';
        
        let results = [];
        let searchType = 'text';
        
        // Location-based search (Near Me)
        if (nearMe && userLat && userLng) {
            results = await Group.searchGroupsNearby(userLat, userLng, radius, query);
            searchType = 'location';
        }
        // Regular text search with optional location filtering OR show all groups
        else {
            // Start with all groups or search results
            if (query.trim()) {
                results = await Group.searchGroups(query);
            } else if (userLat && userLng) {
                results = await Group.getAllGroupsWithDistance(userLat, userLng);
            } else {
                results = await Group.getAllGroups();
            }
            
            // Filter by category if provided
            if (category) {
                results = results.filter(group => 
                    group.categories && 
                    group.categories.some(cat => 
                        cat.toLowerCase().includes(category.toLowerCase()) ||
                        (category === 'student' && (cat.toLowerCase().includes('students') || cat.toLowerCase().includes('student')))
                    )
                );
            }
            
            // Filter by location if provided
            if (location) {
                results = results.filter(group => 
                    (group.city && group.city.toLowerCase().includes(location.toLowerCase())) ||
                    (group.country && group.country.toLowerCase().includes(location.toLowerCase()))
                );
            }
        }
        
        // If we have a query, location search, or near me search, show results page
        if (query.trim() || nearMe || category || location) {
            res.render('results', {
                title: nearMe ? 'Groups Near Me' : (query ? `Search results for "${query}"` : 'Search Results'),
                query: query,
                category: category,
                location: location,
                results: results,
                resultsCount: results.length,
                searchType: searchType,
                userLat: userLat,
                userLng: userLng,
                radius: radius,
                nearMe: nearMe,
                isAdmin: req.session && req.session.admin
            });
        } else {
            // Show search page with all groups
            res.render('search', {
                title: 'Search Groups',
                query: query,
                category: category,
                location: location,
                results: results,
                resultsCount: results.length,
                searchType: searchType,
                userLat: userLat,
                userLng: userLng,
                radius: radius,
                nearMe: nearMe,
                isAdmin: req.session && req.session.admin
            });
        }
        
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).render('error', { 
            title: 'Search Error',
            error: 'Unable to perform search. Please try again later.' 
        });
    }
};

exports.getSearchPage = async (req, res) => {
    try {
        // Show all groups by default
        const results = await Group.getAllGroups();
        
        res.render('search', {
            title: 'Search Groups - Naija Groups',
            query: '',
            category: '',
            location: '',
            results: results,
            resultsCount: results.length,
            isAdmin: req.session && req.session.admin
        });
    } catch (error) {
        console.error('Error loading search page:', error);
        res.status(500).render('error', { 
            title: 'Search Error',
            error: 'Unable to load search page.' 
        });
    }
};