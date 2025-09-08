class IntelligentSearchService {
    
    /**
     * Analyze search intent and return structured search parameters
     * @param {string} query - User search query
     * @param {object} userContext - User location context
     * @returns {object} Search intent analysis
     */
    analyzeSearchIntent(query, userContext = {}) {
        const analysis = {
            originalQuery: query,
            intent: null,
            searchType: 'text',
            location: null,
            cleanQuery: query,
            confidence: 0,
            suggestions: []
        };

        if (!query || !query.trim()) {
            analysis.intent = 'browse';
            analysis.searchType = 'browse';
            return analysis;
        }

        const lowerQuery = query.toLowerCase().trim();

        // Scenario 3: Exact name search (quoted strings or very specific terms)
        if (this.isExactNameSearch(lowerQuery)) {
            analysis.intent = 'exact_name';
            analysis.searchType = 'exact';
            analysis.confidence = 0.9;
            analysis.cleanQuery = query.replace(/['"]/g, '').trim();
            return analysis;
        }

        // Scenario 2: Location-specific search (contains location keywords)
        const locationAnalysis = this.extractLocationFromQuery(lowerQuery);
        if (locationAnalysis.hasLocation) {
            analysis.intent = 'location_specific';
            analysis.searchType = 'location';
            analysis.location = locationAnalysis.location;
            analysis.cleanQuery = locationAnalysis.cleanQuery;
            analysis.confidence = 0.8;
            return analysis;
        }

        // Scenario 1: Category search with auto-location (generic terms like "tennis club", "church", etc.)
        if (this.isCategorySearch(lowerQuery) && userContext.hasLocation) {
            analysis.intent = 'category_nearby';
            analysis.searchType = 'category_location';
            analysis.confidence = 0.7;
            analysis.suggestions = this.generateCategorySuggestions(lowerQuery);
            return analysis;
        }

        // Fallback: General text search
        analysis.intent = 'general_text';
        analysis.searchType = 'text';
        analysis.confidence = 0.5;
        
        return analysis;
    }

    /**
     * Check if query is asking for exact name search
     */
    isExactNameSearch(query) {
        // Quoted strings
        if ((query.startsWith('"') && query.endsWith('"')) || 
            (query.startsWith("'") && query.endsWith("'"))) {
            return true;
        }

        // Very specific patterns that suggest exact names
        const exactNamePatterns = [
            /^[\w\s]+(gym|church|mosque|university|college|school|club|association|foundation|organization)$/i,
            /^(the\s+)?[\w\s]+(group|society|community|center|centre)$/i,
            /^[\w\s]+(ltd|limited|inc|incorporated|ngo)$/i
        ];

        return exactNamePatterns.some(pattern => pattern.test(query));
    }

    /**
     * Extract location information from search query
     */
    extractLocationFromQuery(query) {
        const nigerianLocations = [
            // Major cities
            'lagos', 'abuja', 'kano', 'ibadan', 'benin city', 'port harcourt', 'jos', 'ilorin', 
            'aba', 'onitsha', 'enugu', 'abeokuta', 'owerri', 'warri', 'calabar', 'akure', 
            'awka', 'asaba', 'uyo', 'makurdi', 'minna', 'bauchi', 'gombe', 'yola', 'sokoto',
            'katsina', 'kaduna', 'zaria', 'lokoja', 'lafia', 'nnewi', 'umuahia', 'abakaliki',
            'orlu', 'nsukka',
            
            // States
            'anambra', 'imo', 'abia', 'ebonyi', 'enugu', 'cross river', 'akwa ibom', 'rivers', 
            'bayelsa', 'delta', 'edo', 'ondo', 'ekiti', 'osun', 'oyo', 'ogun', 'kwara', 
            'niger', 'kogi', 'benue', 'plateau', 'nasarawa', 'taraba', 'adamawa', 'borno', 
            'yobe', 'jigawa', 'kano', 'kaduna', 'kebbi', 'sokoto', 'zamfara', 'gombe', 'bauchi',
            
            // International (for diaspora)
            'london', 'manchester', 'birmingham', 'new york', 'houston', 'atlanta', 'chicago',
            'toronto', 'vancouver', 'johannesburg', 'cape town', 'dubai', 'frankfurt'
        ];

        const locationPatterns = [
            // "in [location]" pattern
            { regex: /\b(?:in|at|around|near)\s+([a-z\s]+)$/i, type: 'preposition' },
            // "[location]" at the end
            { regex: /\b([a-z\s]+)$/i, type: 'suffix' },
            // "[location] based" or "[location] area"
            { regex: /\b([a-z\s]+)\s+(?:based|area|region|zone)$/i, type: 'descriptor' }
        ];

        for (const pattern of locationPatterns) {
            const match = query.match(pattern.regex);
            if (match) {
                const potentialLocation = match[1].trim().toLowerCase();
                
                // Check if it matches our known locations
                const matchedLocation = nigerianLocations.find(loc => 
                    loc === potentialLocation || 
                    potentialLocation.includes(loc) ||
                    loc.includes(potentialLocation)
                );
                
                if (matchedLocation) {
                    const cleanQuery = query.replace(match[0], '').trim();
                    return {
                        hasLocation: true,
                        location: matchedLocation,
                        cleanQuery: cleanQuery,
                        matchType: pattern.type
                    };
                }
            }
        }

        return { hasLocation: false, location: null, cleanQuery: query };
    }

    /**
     * Check if query represents a category search
     */
    isCategorySearch(query) {
        const categoryKeywords = [
            // Religious
            'church', 'mosque', 'religious', 'christian', 'muslim', 'faith', 'worship',
            'cathedral', 'chapel', 'synagogue', 'temple',
            
            // Educational
            'school', 'university', 'college', 'alumni', 'student', 'education', 'academic',
            'learning', 'study', 'campus',
            
            // Sports & Fitness
            'gym', 'fitness', 'sports', 'tennis', 'football', 'basketball', 'swimming',
            'boxing', 'martial arts', 'yoga', 'aerobics', 'recreation', 'athletic',
            
            // Professional
            'business', 'professional', 'entrepreneur', 'network', 'trade', 'industry',
            'corporate', 'association', 'chamber',
            
            // Social
            'club', 'group', 'community', 'social', 'cultural', 'society', 'gathering',
            'meetup', 'organization',
            
            // Support
            'support', 'help', 'charity', 'volunteer', 'nonprofit', 'foundation',
            'welfare', 'humanitarian'
        ];

        return categoryKeywords.some(keyword => 
            query.includes(keyword) || 
            // Check for plural forms
            query.includes(keyword + 's') ||
            // Check for related terms
            this.getRelatedTerms(keyword).some(related => query.includes(related))
        );
    }

    /**
     * Generate search suggestions based on category
     */
    generateCategorySuggestions(query) {
        const suggestions = [];
        
        if (query.includes('church') || query.includes('christian')) {
            suggestions.push('Churches near me', 'Christian groups', 'Religious communities');
        }
        
        if (query.includes('gym') || query.includes('fitness')) {
            suggestions.push('Fitness centers near me', 'Sports clubs', 'Health groups');
        }
        
        if (query.includes('school') || query.includes('university')) {
            suggestions.push('Alumni groups', 'Educational institutions', 'Student communities');
        }
        
        if (query.includes('business') || query.includes('professional')) {
            suggestions.push('Professional networks', 'Business groups', 'Entrepreneur communities');
        }

        return suggestions.slice(0, 3); // Limit to 3 suggestions
    }

    /**
     * Get related terms for better matching
     */
    getRelatedTerms(keyword) {
        const relatedTerms = {
            'church': ['parish', 'congregation', 'ministry'],
            'gym': ['fitness', 'workout', 'exercise'],
            'school': ['academy', 'institute', 'college'],
            'business': ['enterprise', 'company', 'corporation'],
            'club': ['society', 'group', 'association'],
            'sports': ['athletics', 'games', 'recreation']
        };
        
        return relatedTerms[keyword] || [];
    }

    /**
     * Get coordinates for known locations
     */
    getLocationCoordinates(locationName) {
        const coordinates = {
            // Nigerian cities
            'lagos': { lat: 6.5244, lng: 3.3792, radius: 25 },
            'abuja': { lat: 9.0765, lng: 7.3986, radius: 20 },
            'kano': { lat: 12.0022, lng: 8.5920, radius: 15 },
            'ibadan': { lat: 7.3775, lng: 3.9470, radius: 15 },
            'port harcourt': { lat: 4.8156, lng: 7.0498, radius: 15 },
            'benin city': { lat: 6.3350, lng: 5.6037, radius: 12 },
            'benin': { lat: 6.3350, lng: 5.6037, radius: 12 },
            'jos': { lat: 9.8965, lng: 8.8583, radius: 12 },
            'ilorin': { lat: 8.4966, lng: 4.5426, radius: 12 },
            'enugu': { lat: 6.5244, lng: 7.5086, radius: 12 },
            'aba': { lat: 5.1066, lng: 7.3667, radius: 10 },
            'onitsha': { lat: 6.1667, lng: 6.7833, radius: 10 },
            'warri': { lat: 5.5167, lng: 5.7500, radius: 10 },
            'calabar': { lat: 4.9517, lng: 8.3220, radius: 10 },
            'akure': { lat: 7.2571, lng: 5.2058, radius: 10 },
            'abeokuta': { lat: 7.1475, lng: 3.3619, radius: 10 },
            'owerri': { lat: 5.4840, lng: 7.0351, radius: 10 },
            'awka': { lat: 6.2104, lng: 7.0714, radius: 10 },
            'asaba': { lat: 6.1987, lng: 6.7405, radius: 10 },
            'uyo': { lat: 5.0380, lng: 7.9070, radius: 10 },
            'makurdi': { lat: 7.7327, lng: 8.5114, radius: 10 },
            
            // International cities
            'london': { lat: 51.5074, lng: -0.1278, radius: 50 },
            'manchester': { lat: 53.4808, lng: -2.2426, radius: 25 },
            'birmingham': { lat: 52.4862, lng: -1.8904, radius: 25 },
            'new york': { lat: 40.7128, lng: -74.0060, radius: 50 },
            'houston': { lat: 29.7604, lng: -95.3698, radius: 30 },
            'atlanta': { lat: 33.7490, lng: -84.3880, radius: 30 },
            'chicago': { lat: 41.8781, lng: -87.6298, radius: 30 },
            'toronto': { lat: 43.6532, lng: -79.3832, radius: 30 },
            'vancouver': { lat: 49.2827, lng: -123.1207, radius: 25 }
        };
        
        return coordinates[locationName.toLowerCase()] || null;
    }
}

// Export singleton instance
module.exports = new IntelligentSearchService();