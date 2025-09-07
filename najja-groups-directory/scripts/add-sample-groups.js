const pool = require('../config/database');

// Sample data for Nigerian groups
const locations = [
    { city: 'Lagos', state: 'Lagos', country: 'Nigeria' },
    { city: 'Abuja', state: 'FCT', country: 'Nigeria' },
    { city: 'Awka', state: 'Anambra', country: 'Nigeria' },
    { city: 'Onitsha', state: 'Anambra', country: 'Nigeria' },
    { city: 'Nnewi', state: 'Anambra', country: 'Nigeria' },
    { city: 'Ikeja', state: 'Lagos', country: 'Nigeria' },
    { city: 'Victoria Island', state: 'Lagos', country: 'Nigeria' },
    { city: 'Ikoyi', state: 'Lagos', country: 'Nigeria' }
];

const churches = [
    'Redeemed Christian Church of God',
    'Living Faith Church',
    'Mountain of Fire and Miracles',
    'Deeper Christian Life Ministry',
    'Christ Embassy',
    'House on the Rock',
    'Daystar Christian Centre',
    'Covenant Christian Centre',
    'Dunamis International Gospel Centre',
    'The Apostolic Church Nigeria',
    'Assemblies of God Nigeria',
    'Methodist Church Nigeria',
    'Anglican Church of Nigeria',
    'Catholic Church',
    'Presbyterian Church of Nigeria'
];

const schools = [
    'University of Lagos Alumni Association',
    'University of Nigeria Nsukka Alumni',
    'Ahmadu Bello University Alumni',
    'Obafemi Awolowo University Alumni',
    'University of Ibadan Alumni',
    'Nnamdi Azikiwe University Alumni',
    'Lagos State University Alumni',
    'Covenant University Alumni',
    'Babcock University Alumni',
    'Federal University of Technology Alumni'
];

const organizations = [
    'Igbo Union',
    'Yoruba Cultural Association',
    'Hausa Community',
    'Nigerian Medical Association',
    'Nigerian Bar Association',
    'Nigerian Engineers Forum',
    'Nollywood Actors Guild',
    'Nigerian Diaspora Business Network',
    'Women of Nigeria International',
    'Nigerian Youth Development Initiative',
    'Nigerian Entrepreneurs Network',
    'Nigerian Sports Club',
    'Nigerian Cultural Heritage Foundation',
    'Nigerian Tech Community',
    'Nigerian Agricultural Society'
];

const descriptions = {
    church: [
        'A vibrant Christian community committed to spreading the gospel and building strong faith-based relationships.',
        'Dedicated to spiritual growth, community service, and fellowship among believers.',
        'A place of worship, prayer, and spiritual development for all family members.',
        'Building disciples and transforming lives through the power of God\'s word.',
        'A community of believers focused on worship, evangelism, and social impact.'
    ],
    school: [
        'Connecting graduates and fostering lifelong relationships among alumni worldwide.',
        'Supporting educational initiatives and maintaining strong bonds with our alma mater.',
        'Creating networking opportunities and mentorship programs for current and former students.',
        'Advancing academic excellence and contributing to institutional development.',
        'Building bridges between past and present students for mutual growth and development.'
    ],
    organization: [
        'Promoting cultural heritage and unity among Nigerian communities.',
        'Advancing professional development and networking opportunities.',
        'Creating positive impact through community service and social initiatives.',
        'Fostering collaboration and knowledge sharing among members.',
        'Building stronger communities through cultural preservation and social engagement.'
    ]
};

function generateSlug(name) {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim('-');
}

function getRandomItem(array) {
    return array[Math.floor(Math.random() * array.length)];
}

function getRandomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function addSampleGroups() {
    try {
        console.log('🚀 Starting to add 100 sample Nigerian groups...');
        
        const groups = [];
        let counter = 0;

        // Add 40 churches
        for (let i = 0; i < 40; i++) {
            const church = getRandomItem(churches);
            const location = getRandomItem(locations);
            const branch = ['Central', 'North', 'South', 'East', 'West', 'Main', 'New', 'International'][Math.floor(Math.random() * 8)];
            
            const name = `${church} - ${location.city} ${branch}`;
            const slug = generateSlug(name) + '-' + (++counter);
            
            groups.push({
                slug,
                name,
                description: getRandomItem(descriptions.church),
                city: location.city,
                region: location.state,
                country: location.country,
                categories: ['church', 'religious', 'community'],
                founded_year: getRandomNumber(1980, 2020),
                member_size: getRandomNumber(50, 2000),
                membership_type: 'public',
                meeting_days: ['Sunday', Math.random() > 0.5 ? 'Wednesday' : 'Friday'].filter(Boolean),
                featured: Math.random() > 0.8, // 20% chance of being featured
                logo_url: `/uploads/logos/church-${getRandomNumber(1, 5)}.jpg` // We'll create these
            });
        }

        // Add 25 school alumni associations
        for (let i = 0; i < 25; i++) {
            const school = getRandomItem(schools);
            const location = getRandomItem(locations);
            
            const name = `${school} - ${location.city} Chapter`;
            const slug = generateSlug(name) + '-' + (++counter);
            
            groups.push({
                slug,
                name,
                description: getRandomItem(descriptions.school),
                city: location.city,
                region: location.state,
                country: location.country,
                categories: ['alumni', 'education', 'networking'],
                founded_year: getRandomNumber(1990, 2015),
                member_size: getRandomNumber(100, 5000),
                membership_type: Math.random() > 0.7 ? 'private' : 'public',
                meeting_days: ['Saturday'],
                featured: Math.random() > 0.85, // 15% chance of being featured
                logo_url: `/uploads/logos/school-${getRandomNumber(1, 5)}.jpg`
            });
        }

        // Add 35 various organizations
        for (let i = 0; i < 35; i++) {
            const org = getRandomItem(organizations);
            const location = getRandomItem(locations);
            
            const name = `${org} - ${location.city}`;
            const slug = generateSlug(name) + '-' + (++counter);
            
            const categoryTypes = [
                ['cultural', 'community', 'social'],
                ['professional', 'networking', 'business'],
                ['community', 'social', 'youth'],
                ['cultural', 'arts', 'entertainment']
            ];
            
            groups.push({
                slug,
                name,
                description: getRandomItem(descriptions.organization),
                city: location.city,
                region: location.state,
                country: location.country,
                categories: getRandomItem(categoryTypes),
                founded_year: getRandomNumber(1985, 2020),
                member_size: getRandomNumber(30, 1500),
                membership_type: Math.random() > 0.6 ? 'public' : 'private',
                meeting_days: [getRandomItem(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'])],
                featured: Math.random() > 0.9, // 10% chance of being featured
                logo_url: `/uploads/logos/org-${getRandomNumber(1, 5)}.jpg`
            });
        }

        // Insert all groups into database
        console.log(`📝 Inserting ${groups.length} groups into database...`);
        
        for (let i = 0; i < groups.length; i++) {
            const group = groups[i];
            
            try {
                await pool.query(`
                    INSERT INTO groups (
                        slug, name, description, city, region, country,
                        categories, founded_year, member_size, membership_type,
                        meeting_days, featured, logo_url, created_at
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())
                `, [
                    group.slug,
                    group.name,
                    group.description,
                    group.city,
                    group.region,
                    group.country,
                    group.categories,
                    group.founded_year,
                    group.member_size,
                    group.membership_type,
                    group.meeting_days,
                    group.featured,
                    group.logo_url
                ]);
                
                if ((i + 1) % 10 === 0) {
                    console.log(`✅ Added ${i + 1}/${groups.length} groups...`);
                }
                
            } catch (error) {
                console.error(`❌ Error adding group "${group.name}":`, error.message);
            }
        }
        
        // Get final count
        const result = await pool.query('SELECT COUNT(*) FROM groups');
        console.log(`🎉 Successfully added sample groups! Total groups in database: ${result.rows[0].count}`);
        
        // Show featured groups count
        const featuredResult = await pool.query('SELECT COUNT(*) FROM groups WHERE featured = true');
        console.log(`⭐ Featured groups: ${featuredResult.rows[0].count}`);
        
    } catch (error) {
        console.error('❌ Error adding sample groups:', error.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

addSampleGroups();