const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('render.com') ? { rejectUnauthorized: false } : false
});

// Realistic data for Nigerian diaspora groups
const groupTypes = [
    'Association', 'Church', 'Cultural Center', 'Student Union', 'Business Network',
    'Professional Association', 'Community Center', 'Social Club', 'Women\'s Group',
    'Youth Organization', 'Religious Group', 'Trade Association', 'Alumni Network'
];

const categories = [
    ['religion', 'church'], ['culture', 'tradition'], ['business', 'networking'],
    ['education', 'student'], ['social', 'community'], ['professional', 'career'],
    ['women', 'empowerment'], ['youth', 'development'], ['trade', 'commerce'],
    ['health', 'wellness'], ['sports', 'recreation'], ['arts', 'entertainment']
];

const nigerianStates = [
    'Lagos', 'Kano', 'Oyo', 'Rivers', 'Kaduna', 'Ogun', 'Imo', 'Borno', 'Osun',
    'Delta', 'Anambra', 'Taraba', 'Katsina', 'Cross River', 'Plateau', 'Bauchi',
    'Gombe', 'Ondo', 'Abia', 'Adamawa', 'Bayelsa', 'Benue', 'Ebonyi', 'Edo',
    'Ekiti', 'Enugu', 'Jigawa', 'Kebbi', 'Kogi', 'Kwara', 'Nasarawa', 'Niger',
    'Sokoto', 'Yobe', 'Zamfara', 'FCT'
];

const countries = [
    { name: 'United States', cities: ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose', 'Austin', 'Jacksonville', 'Fort Worth', 'Columbus', 'Charlotte'] },
    { name: 'United Kingdom', cities: ['London', 'Manchester', 'Birmingham', 'Leeds', 'Glasgow', 'Sheffield', 'Bradford', 'Liverpool', 'Edinburgh', 'Bristol', 'Cardiff', 'Coventry', 'Leicester', 'Sunderland', 'Belfast'] },
    { name: 'Canada', cities: ['Toronto', 'Montreal', 'Vancouver', 'Calgary', 'Edmonton', 'Ottawa', 'Winnipeg', 'Quebec City', 'Hamilton', 'Kitchener', 'London', 'Victoria', 'Halifax', 'Windsor', 'Saskatoon'] },
    { name: 'Germany', cities: ['Berlin', 'Hamburg', 'Munich', 'Cologne', 'Frankfurt', 'Stuttgart', 'Düsseldorf', 'Dortmund', 'Essen', 'Leipzig', 'Bremen', 'Dresden', 'Hanover', 'Nuremberg', 'Duisburg'] },
    { name: 'Australia', cities: ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide', 'Gold Coast', 'Newcastle', 'Canberra', 'Sunshine Coast', 'Wollongong', 'Hobart', 'Geelong', 'Townsville', 'Cairns', 'Darwin'] },
    { name: 'France', cities: ['Paris', 'Marseille', 'Lyon', 'Toulouse', 'Nice', 'Nantes', 'Montpellier', 'Strasbourg', 'Bordeaux', 'Lille', 'Rennes', 'Reims', 'Saint-Étienne', 'Toulon', 'Le Havre'] },
    { name: 'Netherlands', cities: ['Amsterdam', 'Rotterdam', 'The Hague', 'Utrecht', 'Eindhoven', 'Tilburg', 'Groningen', 'Almere', 'Breda', 'Nijmegen', 'Enschede', 'Haarlem', 'Arnhem', 'Zaanstad', 'Amersfoort'] },
    { name: 'South Africa', cities: ['Johannesburg', 'Cape Town', 'Durban', 'Pretoria', 'Port Elizabeth', 'Bloemfontein', 'East London', 'Nelspruit', 'Polokwane', 'Kimberley', 'Rustenburg', 'Pietermaritzburg', 'Welkom', 'Newcastle', 'Vereeniging'] },
    { name: 'Italy', cities: ['Rome', 'Milan', 'Naples', 'Turin', 'Palermo', 'Genoa', 'Bologna', 'Florence', 'Bari', 'Catania', 'Venice', 'Verona', 'Messina', 'Padua', 'Trieste'] },
    { name: 'Spain', cities: ['Madrid', 'Barcelona', 'Valencia', 'Seville', 'Zaragoza', 'Málaga', 'Murcia', 'Palma', 'Las Palmas', 'Bilbao', 'Alicante', 'Córdoba', 'Valladolid', 'Vigo', 'Gijón'] }
];

const phoneFormats = {
    'United States': () => `+1 ${Math.floor(Math.random() * 900 + 100)}-${Math.floor(Math.random() * 900 + 100)}-${Math.floor(Math.random() * 9000 + 1000)}`,
    'United Kingdom': () => `+44 ${Math.floor(Math.random() * 90 + 10)} ${Math.floor(Math.random() * 9000 + 1000)} ${Math.floor(Math.random() * 9000 + 1000)}`,
    'Canada': () => `+1 ${Math.floor(Math.random() * 900 + 100)}-${Math.floor(Math.random() * 900 + 100)}-${Math.floor(Math.random() * 9000 + 1000)}`,
    'Germany': () => `+49 ${Math.floor(Math.random() * 90 + 10)} ${Math.floor(Math.random() * 90000000 + 10000000)}`,
    'Australia': () => `+61 ${Math.floor(Math.random() * 90 + 10)} ${Math.floor(Math.random() * 9000 + 1000)} ${Math.floor(Math.random() * 9000 + 1000)}`,
    'France': () => `+33 ${Math.floor(Math.random() * 90 + 10)} ${Math.floor(Math.random() * 900 + 100)} ${Math.floor(Math.random() * 900 + 100)} ${Math.floor(Math.random() * 900 + 100)}`,
    'Netherlands': () => `+31 ${Math.floor(Math.random() * 90 + 10)} ${Math.floor(Math.random() * 9000000 + 1000000)}`,
    'South Africa': () => `+27 ${Math.floor(Math.random() * 90 + 10)} ${Math.floor(Math.random() * 900 + 100)} ${Math.floor(Math.random() * 9000 + 1000)}`,
    'Italy': () => `+39 ${Math.floor(Math.random() * 900 + 100)} ${Math.floor(Math.random() * 900 + 100)} ${Math.floor(Math.random() * 9000 + 1000)}`,
    'Spain': () => `+34 ${Math.floor(Math.random() * 900 + 100)} ${Math.floor(Math.random() * 900 + 100)} ${Math.floor(Math.random() * 900 + 100)}`
};

const meetingDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const descriptions = [
    "A vibrant community organization dedicated to preserving Nigerian culture and traditions while building bridges in the diaspora.",
    "Bringing together Nigerian professionals and entrepreneurs for networking, mentorship, and business development opportunities.",
    "A spiritual home away from home, offering worship services, fellowship, and community support for Nigerian families.",
    "Supporting Nigerian students with scholarships, mentorship, and academic resources to excel in their educational journey.",
    "Empowering Nigerian women through leadership development, business training, and cultural preservation programs.",
    "Promoting Nigerian arts, music, and cultural heritage through festivals, exhibitions, and educational programs.",
    "A platform for young Nigerians to connect, develop leadership skills, and make positive impact in their communities.",
    "Facilitating trade and business connections between Nigeria and the diaspora through networking and investment opportunities.",
    "Providing social services, cultural education, and community support to Nigerian immigrants and their families.",
    "Building professional networks and career development opportunities for Nigerian graduates and working professionals."
];

function generateSlug(name) {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}

function randomChoice(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function randomChoices(arr, count) {
    const shuffled = [...arr].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}

function generateEmail(name, domain = null) {
    const cleanName = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const domains = domain ? [domain] : ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'organization.org'];
    return `${cleanName}@${randomChoice(domains)}`;
}

function generateWebsite(name) {
    const cleanName = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const tlds = ['.org', '.com', '.net', '.info'];
    return `https://www.${cleanName}${randomChoice(tlds)}`;
}

function generateProfilePicture(groupType, category) {
    // Different image sources for variety and reliability
    const imageAPIs = [
        // Unsplash - high quality photos
        {
            baseUrl: 'https://images.unsplash.com',
            getUrl: () => {
                const imageIds = [
                    '1511632765486-a01980ef76b8', // group of people
                    '1529156069898-49953e39b3ac', // people meeting
                    '1552664730-d307ca884978', // community gathering
                    '1517457373958-b7bdd4587205', // diverse group
                    '1559027615-cd4628902d4a', // team meeting
                    '1515187029135-18ee286d815b', // people networking
                    '1522202176988-66273c2fd55f', // business meeting
                    '1521737604893-d14cc237f11d', // group discussion
                    '1516321318423-f06f85e504b3', // community event
                    '1573164713619-5d0b33642cdb', // cultural gathering
                    '1491438590914-bc09fcaaf77a', // religious group
                    '1560472354-b33ff0c44a43', // student group
                    '1517245386807-bb43f82c33c4', // women's group
                    '1544717684-9c6b8b2b8b14', // youth organization
                    '1506905925346-21bda4d32df4', // professional association
                    '1517245386807-bb43f82c33c4', // diverse community
                    '1573496359142-b8d87734a5a2', // cultural celebration
                    '1559136555-f9b5e32056d5', // business networking
                    '1522071820677-6ec0dd4d2c2d', // church gathering
                    '1571019613454-1cb2f99b2d8b'  // social club
                ];
                const imageId = randomChoice(imageIds);
                const width = 400;
                const height = 400;
                return `${this.baseUrl}/photo-${imageId}?w=${width}&h=${height}&fit=crop&crop=faces`;
            }
        },
        
        // Placeholder services with themed images
        {
            baseUrl: 'https://picsum.photos',
            getUrl: () => {
                const seed = Math.floor(Math.random() * 1000);
                return `${this.baseUrl}/400/400?random=${seed}`;
            }
        },
        
        // Avatar placeholder for organizations
        {
            baseUrl: 'https://ui-avatars.com/api',
            getUrl: (name) => {
                const initials = name.split(' ').map(word => word[0]).join('').substring(0, 2).toUpperCase();
                const colors = ['3B82F6', '10B981', 'F59E0B', 'EF4444', '8B5CF6', '06B6D4', 'F97316', 'EC4899'];
                const bgColor = randomChoice(colors);
                return `${this.baseUrl}/?name=${encodeURIComponent(initials)}&size=400&background=${bgColor}&color=fff&bold=true&format=png`;
            }
        },
        
        // RoboHash for unique organizational avatars
        {
            baseUrl: 'https://robohash.org',
            getUrl: (name) => {
                const hash = name.toLowerCase().replace(/[^a-z0-9]/g, '');
                const sets = ['set1', 'set2', 'set3', 'set4'];
                const set = randomChoice(sets);
                return `${this.baseUrl}/${hash}?size=400x400&set=${set}&format=png`;
            }
        },
        
        // DiceBear for organization-style avatars
        {
            baseUrl: 'https://api.dicebear.com/7.x',
            getUrl: (name) => {
                const styles = ['initials', 'shapes', 'identicon'];
                const style = randomChoice(styles);
                const seed = name.toLowerCase().replace(/[^a-z0-9]/g, '');
                return `${this.baseUrl}/${style}/png?seed=${seed}&size=400&backgroundColor=random`;
            }
        }
    ];
    
    // Choose image source based on group type and random selection
    let selectedAPI;
    
    if (groupType.includes('Church') || groupType.includes('Religious')) {
        // Prefer real photos for religious groups
        selectedAPI = imageAPIs[0]; // Unsplash
    } else if (groupType.includes('Professional') || groupType.includes('Business')) {
        // Mix of real photos and clean avatars for professional groups
        selectedAPI = randomChoice([imageAPIs[0], imageAPIs[2], imageAPIs[4]]);
    } else if (groupType.includes('Student') || groupType.includes('Youth')) {
        // More varied options for younger groups
        selectedAPI = randomChoice([imageAPIs[0], imageAPIs[1], imageAPIs[3]]);
    } else {
        // Random selection for other group types
        selectedAPI = randomChoice(imageAPIs);
    }
    
    return selectedAPI.getUrl;
}

function generateCoordinates(city, country) {
    // Approximate coordinates for major cities (in real app, you'd use a geocoding API)
    const cityCoords = {
        // US cities
        'New York': [40.7128, -74.0060],
        'Los Angeles': [34.0522, -118.2437],
        'Chicago': [41.8781, -87.6298],
        'Houston': [29.7604, -95.3698],
        // UK cities
        'London': [51.5074, -0.1278],
        'Manchester': [53.4808, -2.2426],
        'Birmingham': [52.4862, -1.8904],
        // Add more as needed...
    };
    
    const baseCoords = cityCoords[city] || [0, 0];
    // Add small random offset
    return [
        baseCoords[0] + (Math.random() - 0.5) * 0.1,
        baseCoords[1] + (Math.random() - 0.5) * 0.1
    ];
}

async function generateGroups(count = 200) {
    const groups = [];
    const usedNames = new Set();
    
    console.log(`🔄 Generating ${count} realistic Nigerian diaspora groups...`);
    
    for (let i = 0; i < count; i++) {
        const country = randomChoice(countries);
        const city = randomChoice(country.cities);
        const groupType = randomChoice(groupTypes);
        const state = randomChoice(nigerianStates);
        const category = randomChoice(categories);
        
        // Generate unique group name
        let name;
        let attempts = 0;
        do {
            const namePatterns = [
                `${state} ${groupType} of ${city}`,
                `Nigerian ${groupType} - ${city}`,
                `${city} ${state} Community ${groupType}`,
                `${state} Cultural ${groupType} ${city}`,
                `Nigerian ${groupType} ${city} Chapter`,
                `${city} Nigerian ${groupType}`,
                `${state} ${groupType} International - ${city}`,
                `Nigerian ${groupType} Association ${city}`,
                `${city} ${state} ${groupType} Union`,
                `${state} Heritage ${groupType} ${city}`
            ];
            name = randomChoice(namePatterns);
            attempts++;
        } while (usedNames.has(name) && attempts < 50);
        
        if (usedNames.has(name)) {
            name = `${name} ${i + 1}`; // Add number if we can't find unique name
        }
        usedNames.add(name);
        
        const slug = generateSlug(name);
        const [lat, lng] = generateCoordinates(city, country.name);
        
        const group = {
            slug,
            name,
            description: randomChoice(descriptions),
            address: `${Math.floor(Math.random() * 9999 + 1)} ${randomChoice(['Main', 'Church', 'Community', 'Cultural', 'Heritage', 'Unity', 'Freedom', 'Peace'])} ${randomChoice(['Street', 'Avenue', 'Road', 'Drive', 'Lane'])}, ${city}, ${country.name}`,
            city,
            region: Math.random() > 0.7 ? randomChoice(['North', 'South', 'East', 'West', 'Central']) : null,
            country: country.name,
            lat,
            lng,
            phone: phoneFormats[country.name] ? phoneFormats[country.name]() : null,
            email: generateEmail(name),
            website: Math.random() > 0.3 ? generateWebsite(name) : null,
            whatsapp_phone: Math.random() > 0.5 ? (phoneFormats[country.name] ? phoneFormats[country.name]() : null) : null,
            categories: category,
            meeting_days: Math.random() > 0.4 ? randomChoices(meetingDays, Math.floor(Math.random() * 3) + 1) : null,
            founded_year: Math.floor(Math.random() * 30) + 1995, // 1995-2024
            member_size: Math.floor(Math.random() * 2000) + 50, // 50-2050 members
            membership_type: randomChoice(['public', 'private', 'invitation']),
            featured: Math.random() > 0.9, // 10% featured
            status: Math.random() > 0.1 ? 'approved' : 'pending', // 90% approved
            logo_url: Math.random() > 0.15 ? generateProfilePicture(groupType, category)(name) : null, // 85% have profile pics
            facebook_url: Math.random() > 0.4 ? `https://facebook.com/${generateSlug(name)}` : null,
            instagram_url: Math.random() > 0.5 ? `https://instagram.com/${generateSlug(name)}` : null,
            twitter_url: Math.random() > 0.6 ? `https://twitter.com/${generateSlug(name)}` : null,
            linkedin_url: Math.random() > 0.7 ? `https://linkedin.com/company/${generateSlug(name)}` : null,
            youtube_url: Math.random() > 0.8 ? `https://youtube.com/@${generateSlug(name)}` : null,
            created_at: new Date(2020 + Math.floor(Math.random() * 5), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1)
        };
        
        groups.push(group);
        
        if ((i + 1) % 50 === 0) {
            console.log(`📊 Generated ${i + 1}/${count} groups...`);
        }
    }
    
    console.log(`✅ Generated ${groups.length} unique groups`);
    return groups;
}

async function insertGroups(groups) {
    console.log(`🔄 Inserting ${groups.length} groups into database...`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const group of groups) {
        try {
            // Check if group already exists
            const existingGroup = await pool.query(
                'SELECT id FROM groups WHERE slug = $1 OR name = $2',
                [group.slug, group.name]
            );
            
            if (existingGroup.rows.length > 0) {
                console.log(`⚠️  Group "${group.name}" already exists, skipping`);
                continue;
            }
            
            await pool.query(`
                INSERT INTO groups (
                    slug, name, description, address, city, region, country,
                    lat, lng, phone, email, website, whatsapp_phone,
                    categories, meeting_days, founded_year, member_size,
                    membership_type, featured, status, logo_url,
                    facebook_url, instagram_url, twitter_url, linkedin_url, youtube_url,
                    created_at
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13,
                    $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27
                )
            `, [
                group.slug,
                group.name,
                group.description,
                group.address,
                group.city,
                group.region,
                group.country,
                group.lat,
                group.lng,
                group.phone,
                group.email,
                group.website,
                group.whatsapp_phone,
                group.categories,
                group.meeting_days,
                group.founded_year,
                group.member_size,
                group.membership_type,
                group.featured,
                group.status,
                group.logo_url,
                group.facebook_url,
                group.instagram_url,
                group.twitter_url,
                group.linkedin_url,
                group.youtube_url,
                group.created_at
            ]);
            
            successCount++;
            
            if (successCount % 25 === 0) {
                console.log(`📊 Inserted ${successCount} groups...`);
            }
            
        } catch (error) {
            errorCount++;
            console.error(`❌ Failed to insert "${group.name}":`, error.message);
        }
    }
    
    return { successCount, errorCount };
}

async function seedDatabase(count = 200) {
    try {
        console.log('🌱 Starting database seeding with Nigerian diaspora groups...');
        
        // Generate groups
        const groups = await generateGroups(count);
        
        // Insert groups
        const { successCount, errorCount } = await insertGroups(groups);
        
        console.log(`\\n📊 Seeding completed:`);
        console.log(`✅ Successfully inserted: ${successCount} groups`);
        console.log(`❌ Failed: ${errorCount} groups`);
        
        // Show final statistics
        const finalCount = await pool.query('SELECT COUNT(*) FROM groups');
        const countByCountry = await pool.query(`
            SELECT country, COUNT(*) as count 
            FROM groups 
            GROUP BY country 
            ORDER BY count DESC
        `);
        const featuredCount = await pool.query('SELECT COUNT(*) FROM groups WHERE featured = true');
        
        console.log(`\\n📈 Database Statistics:`);
        console.log(`Total groups: ${finalCount.rows[0].count}`);
        console.log(`Featured groups: ${featuredCount.rows[0].count}`);
        console.log(`\\nGroups by country:`);
        console.table(countByCountry.rows);
        
    } catch (error) {
        console.error('❌ Seeding failed:', error);
    } finally {
        await pool.end();
        process.exit(0);
    }
}

// Run the seeder
if (require.main === module) {
    const count = parseInt(process.argv[2]) || 200;
    console.log(`🌱 Seeding database with ${count} Nigerian diaspora groups...`);
    seedDatabase(count);
}

module.exports = { seedDatabase, generateGroups, insertGroups };