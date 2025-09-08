const Group = require('../models/Group');
const geoip = require('geoip-lite');
const intelligentSearchService = require('../services/intelligentSearchService');

// Helper function to extract location from search query
function extractLocationFromQuery(query) {
    const nigerianCities = [
        'lagos', 'abuja', 'kano', 'ibadan', 'benin', 'port harcourt', 'jos', 'ilorin', 'aba', 'onitsha',
        'enugu', 'abeokuta', 'owerri', 'warri', 'calabar', 'akure', 'awka', 'asaba', 'uyo', 'makurdi',
        'minna', 'bauchi', 'gombe', 'yola', 'sokoto', 'katsina', 'kaduna', 'zaria', 'lokoja', 'lafia',
        'nnewi', 'umuahia', 'abakaliki', 'owerri', 'orlu', 'nsukka', 'onitsha', 'aba', 'anambra',
        'imo', 'abia', 'ebonyi', 'enugu', 'cross river', 'akwa ibom', 'rivers', 'bayelsa', 'delta',
        'edo', 'ondo', 'ekiti', 'osun', 'oyo', 'ogun', 'kwara', 'niger', 'kogi', 'benue', 'plateau',
        'nasarawa', 'taraba', 'adamawa', 'borno', 'yobe', 'jigawa', 'katsina', 'kano', 'kaduna',
        'kebbi', 'sokoto', 'zamfara', 'gombe', 'bauchi'
    ];
    
    const lowerQuery = query.toLowerCase();
    let foundLocation = null;
    let cleanQuery = query;
    
    // Check for "in [location]" pattern
    const inLocationMatch = lowerQuery.match(/\bin\s+([a-z\s]+)$/);
    if (inLocationMatch) {
        const potentialLocation = inLocationMatch[1].trim();
        if (nigerianCities.includes(potentialLocation)) {
            foundLocation = potentialLocation;
            cleanQuery = query.replace(new RegExp(`\\bin\\s+${potentialLocation}`, 'i'), '').trim();
        }
    }
    
    // Check for "[location]" at the end
    if (!foundLocation) {
        for (const city of nigerianCities) {
            if (lowerQuery.endsWith(` ${city}`) || lowerQuery === city) {
                foundLocation = city;
                cleanQuery = query.replace(new RegExp(`\\s*${city}$`, 'i'), '').trim();
                break;
            }
        }
    }
    
    return { location: foundLocation, cleanQuery: cleanQuery };
}

// Helper function to get user's approximate location from IP
function getUserLocationFromIP(req) {
    const userIP = req.headers['x-forwarded-for'] || 
                   req.connection.remoteAddress || 
                   req.socket.remoteAddress ||
                   (req.connection.socket ? req.connection.socket.remoteAddress : null);
    
    // For local development, use a Nigerian IP for testing
    const testIP = userIP === '127.0.0.1' || userIP === '::1' ? '197.210.70.0' : userIP;
    
    const geo = geoip.lookup(testIP);
    return geo;
}

// Helper function to get coordinates for Nigerian cities
function getCityCoordinates(cityName) {
    const cityCoords = {
        'lagos': { lat: 6.5244, lng: 3.3792 },
        'abuja': { lat: 9.0765, lng: 7.3986 },
        'kano': { lat: 12.0022, lng: 8.5920 },
        'ibadan': { lat: 7.3775, lng: 3.9470 },
        'port harcourt': { lat: 4.8156, lng: 7.0498 },
        'benin': { lat: 6.3350, lng: 5.6037 },
        'jos': { lat: 9.8965, lng: 8.8583 },
        'ilorin': { lat: 8.4966, lng: 4.5426 },
        'enugu': { lat: 6.5244, lng: 7.5086 },
        'aba': { lat: 5.1066, lng: 7.3667 },
        'onitsha': { lat: 6.1667, lng: 6.7833 },
        'warri': { lat: 5.5167, lng: 5.7500 },
        'calabar': { lat: 4.9517, lng: 8.3220 },
        'akure': { lat: 7.2571, lng: 5.2058 },
        'abeokuta': { lat: 7.1475, lng: 3.3619 },
        'owerri': { lat: 5.4840, lng: 7.0351 },
        'awka': { lat: 6.2104, lng: 7.0714 },
        'asaba': { lat: 6.1987, lng: 6.7405 },
        'uyo': { lat: 5.0380, lng: 7.9070 },
        'makurdi': { lat: 7.7327, lng: 8.5114 },
    };
    
    return cityCoords[cityName.toLowerCase()] || null;
}

exports.searchGroups = async (req, res) => {
    try {
        const originalQuery = req.query.q || '';
        const category = req.query.category || '';
        const meetingDay = req.query.meeting_day || '';
        const membershipType = req.query.membership_type || '';
        const city = req.query.city || '';
        const country = req.query.country || '';
        const verified = req.query.verified === 'true' ? true : (req.query.verified === 'false' ? false : null);
        const featured = req.query.featured === 'true' ? true : (req.query.featured === 'false' ? false : null);
        const sortBy = req.query.sort || 'relevance';
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const userLat = req.query.lat ? parseFloat(req.query.lat) : null;
        const userLng = req.query.lng ? parseFloat(req.query.lng) : null;
        const radius = req.query.radius ? parseInt(req.query.radius) : 25;
        const nearMe = req.query.near_me === 'true';
        
        let results = [];
        let searchType = 'text';
        let searchContext = {
            originalQuery,
            parsedLocation: null,
            searchTerms: originalQuery,
            userLocation: null,
            searchRadius: radius
        };
        
        // Get user's location from IP if not provided
        if (!userLat && !userLng) {
            const ipLocation = getUserLocationFromIP(req);
            if (ipLocation && ipLocation.ll) {
                searchContext.userLocation = {
                    lat: ipLocation.ll[0],
                    lng: ipLocation.ll[1],
                    city: ipLocation.city,
                    country: ipLocation.country
                };
            }
        } else {
            searchContext.userLocation = { lat: userLat, lng: userLng };
        }

        // Use basic search for now until advanced search parameter issue is fixed
        if (originalQuery.trim()) {
            results = await Group.searchGroups(originalQuery);
        } else if (category) {
            results = await Group.searchGroups('');
            // Filter by category
            results = results.filter(group => 
                group.categories && 
                group.categories.some(cat => 
                    cat.toLowerCase().includes(category.toLowerCase())
                )
            );
        } else {
            // Get user location and show nearby if available
            if (searchContext.userLocation) {
                results = await Group.getAllGroupsWithDistance(
                    searchContext.userLocation.lat, 
                    searchContext.userLocation.lng
                );
            } else {
                results = await Group.getAllGroups();
            }
        }
        
        searchType = 'basic';
        
        // Get dynamic categories for filter buttons
        const allCategories = await Group.getAllCategories();
        
        // Render results
        const renderData = {
            title: nearMe ? 'Groups Near Me' : (originalQuery ? `Search results for "${originalQuery}"` : 'Search Results'),
            query: originalQuery,
            category: category,
            meetingDay: meetingDay,
            membershipType: membershipType,
            city: city,
            country: country,
            verified: verified,
            featured: featured,
            sortBy: sortBy,
            page: page,
            limit: limit,
            results: results,
            resultsCount: results.length,
            searchType: searchType,
            searchContext: searchContext,
            userLat: searchContext.userLocation ? searchContext.userLocation.lat : userLat,
            userLng: searchContext.userLocation ? searchContext.userLocation.lng : userLng,
            radius: radius,
            nearMe: nearMe,
            allCategories: allCategories,
            isAdmin: req.session && req.session.admin
        };
        
        // Show results if we have a query or filters
        if (originalQuery.trim() || nearMe || category) {
            res.render('search', renderData);
        } else {
            res.render('search', renderData);
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
        const allCategories = await Group.getAllCategories();
        
        res.render('search', {
            title: 'Search Groups - Naija Groups',
            query: '',
            category: '',
            location: '',
            results: results,
            resultsCount: results.length,
            allCategories: allCategories,
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

// API endpoint for search suggestions
exports.getSearchSuggestions = async (req, res) => {
    try {
        const query = req.query.q || '';
        const limit = parseInt(req.query.limit) || 10;
        
        if (!query.trim() || query.length < 2) {
            return res.json([]);
        }
        
        const suggestions = await Group.getSearchSuggestions(query, limit);
        res.json(suggestions);
    } catch (error) {
        console.error('Error getting search suggestions:', error);
        res.status(500).json({ error: 'Failed to get suggestions' });
    }
};

// API endpoint for category suggestions
exports.getCategorySuggestions = async (req, res) => {
    try {
        const query = req.query.q || '';
        const limit = parseInt(req.query.limit) || 10;
        
        const suggestions = await Group.getCategorySuggestions(query, limit);
        res.json(suggestions);
    } catch (error) {
        console.error('Error getting category suggestions:', error);
        res.status(500).json({ error: 'Failed to get category suggestions' });
    }
};

// API endpoint for location suggestions (Nigerian cities)
exports.getLocationSuggestions = (req, res) => {
    try {
        const query = req.query.q || '';
        const limit = parseInt(req.query.limit) || 10;
        
        if (!query.trim() || query.length < 2) {
            return res.json([]);
        }
        
        const nigerianCities = [
            'Lagos', 'Abuja', 'Kano', 'Ibadan', 'Benin City', 'Port Harcourt', 'Jos', 'Ilorin', 'Aba', 'Onitsha',
            'Enugu', 'Abeokuta', 'Owerri', 'Warri', 'Calabar', 'Akure', 'Awka', 'Asaba', 'Uyo', 'Makurdi',
            'Minna', 'Bauchi', 'Gombe', 'Yola', 'Sokoto', 'Katsina', 'Kaduna', 'Zaria', 'Lokoja', 'Lafia',
            'Nnewi', 'Umuahia', 'Abakaliki', 'Orlu', 'Nsukka', 'Ondo', 'Ikeja', 'Surulere', 'Yaba', 'Mushin'
        ];
        
        const filtered = nigerianCities
            .filter(city => city.toLowerCase().includes(query.toLowerCase()))
            .slice(0, limit);
            
        res.json(filtered);
    } catch (error) {
        console.error('Error getting location suggestions:', error);
        res.status(500).json({ error: 'Failed to get location suggestions' });
    }
};