const Group = require('../models/Group');
const geoip = require('geoip-lite');

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
        
        // Handle explicit "Near Me" button click
        if (nearMe && (userLat && userLng || searchContext.userLocation)) {
            const lat = userLat || searchContext.userLocation.lat;
            const lng = userLng || searchContext.userLocation.lng;
            results = await Group.searchGroupsNearby(lat, lng, radius, originalQuery);
            searchType = 'location';
            searchContext.searchRadius = radius;
        }
        // Handle intelligent search parsing
        else if (originalQuery.trim()) {
            const { location: extractedLocation, cleanQuery } = extractLocationFromQuery(originalQuery);
            searchContext.parsedLocation = extractedLocation;
            searchContext.searchTerms = cleanQuery;
            
            if (extractedLocation) {
                // Intention 2: Search with specific location (e.g., "fitness groups in Enugu")
                const locationCoords = getCityCoordinates(extractedLocation);
                if (locationCoords) {
                    results = await Group.searchGroupsNearby(
                        locationCoords.lat, 
                        locationCoords.lng, 
                        50, // Larger radius for city searches
                        cleanQuery
                    );
                    searchType = 'location';
                    searchContext.searchRadius = 50;
                } else {
                    // Fallback to text search with location filter
                    results = await Group.searchGroups(originalQuery);
                    searchType = 'text';
                }
            } else if (searchContext.userLocation) {
                // Intention 1: Search near user (e.g., "tennis club" - auto-detect location)
                results = await Group.searchGroupsNearby(
                    searchContext.userLocation.lat,
                    searchContext.userLocation.lng,
                    radius,
                    originalQuery
                );
                searchType = 'location';
            } else {
                // Intention 3: Exact name search or fallback text search
                results = await Group.searchGroups(originalQuery);
                searchType = 'text';
            }
        }
        // No search query - show all groups
        else {
            if (searchContext.userLocation) {
                results = await Group.getAllGroupsWithDistance(
                    searchContext.userLocation.lat, 
                    searchContext.userLocation.lng
                );
            } else {
                results = await Group.getAllGroups();
            }
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
        
        // Render results
        const renderData = {
            title: nearMe ? 'Groups Near Me' : (originalQuery ? `Search results for "${originalQuery}"` : 'Search Results'),
            query: originalQuery,
            category: category,
            results: results,
            resultsCount: results.length,
            searchType: searchType,
            searchContext: searchContext,
            userLat: searchContext.userLocation ? searchContext.userLocation.lat : userLat,
            userLng: searchContext.userLocation ? searchContext.userLocation.lng : userLng,
            radius: searchContext.searchRadius,
            nearMe: nearMe,
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