const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('render.com') ? { rejectUnauthorized: false } : false
});

function randomChoice(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function randomChoices(arr, count) {
    const shuffled = [...arr].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}

// Nigerian business data
const nigerianBusinesses = [
    // Food & Restaurants
    {
        business_name: "Mama Cass Restaurant",
        title: "Authentic Nigerian Cuisine in London",
        description: "Experience the taste of home! Fresh jollof rice, suya, and Nigerian delicacies. Order online for delivery or dine-in. #NigerianFood #London",
        business_category: "food_restaurant",
        instagram_url: "https://instagram.com/mamacassrestaurant",
        whatsapp_phone: "+44 7123 456 789",
        website_url: "https://mamacass.co.uk",
        target_countries: ["United Kingdom", "Ireland"],
        target_cities: ["London", "Manchester", "Birmingham"]
    },
    {
        business_name: "Suya King NYC",
        title: "Best Suya in New York City 🔥",
        description: "Grilled perfection! Traditional Nigerian suya made fresh daily. Free delivery in Manhattan. Follow us for daily specials! #Suya #NYC #NigerianFood",
        business_category: "food_restaurant",
        instagram_url: "https://instagram.com/suyakingnyc",
        whatsapp_phone: "+1 646 555 0123",
        target_countries: ["United States"],
        target_cities: ["New York", "Brooklyn", "Queens"]
    },
    {
        business_name: "Nkem's Kitchen Toronto",
        title: "Home-style Nigerian Meals 🍲",
        description: "Bringing Nigerian flavors to Toronto! Egusi, pepper soup, pounded yam and more. Catering available for events. #TorontoEats #NigerianCuisine",
        business_category: "food_restaurant",
        instagram_url: "https://instagram.com/nkemskitchen",
        phone: "+1 416 555 0199",
        website_url: "https://nkemskitchen.ca",
        target_countries: ["Canada"],
        target_cities: ["Toronto", "Mississauga", "Brampton"]
    },

    // Fashion & Beauty
    {
        business_name: "Ankara Dreams",
        title: "Custom Ankara Fashion Worldwide ✨",
        description: "Beautiful custom-made Ankara dresses, agbada, and traditional wear. Ships globally. DM for custom orders! #Ankara #NigerianFashion #AfricanFashion",
        business_category: "fashion_beauty",
        instagram_url: "https://instagram.com/ankaradreams",
        whatsapp_phone: "+234 803 123 4567",
        website_url: "https://ankaradreams.com",
        target_countries: ["Nigeria", "United States", "United Kingdom", "Canada"],
        target_cities: ["Lagos", "Abuja", "London", "New York", "Toronto"]
    },
    {
        business_name: "Afro Beauty Lounge",
        title: "Natural Hair Care Experts 💇🏿‍♀️",
        description: "Specializing in natural African hair care. Braids, locs, relaxers & treatments. Book your appointment today! Located in Houston. #NaturalHair #Houston",
        business_category: "fashion_beauty",
        instagram_url: "https://instagram.com/afrobeautylounge",
        phone: "+1 713 555 0145",
        whatsapp_phone: "+1 713 555 0145",
        target_countries: ["United States"],
        target_cities: ["Houston", "Dallas", "Austin"]
    },
    {
        business_name: "Aso Oke Treasures",
        title: "Premium Aso Oke & Gele 👑",
        description: "Authentic handwoven aso oke, gele, and traditional accessories from Nigeria. Perfect for weddings & special occasions. #AsoOke #NigerianWedding",
        business_category: "fashion_beauty",
        instagram_url: "https://instagram.com/asooketreasures",
        whatsapp_phone: "+234 807 987 6543",
        website_url: "https://asooketreasures.ng",
        target_countries: ["Nigeria", "United States", "United Kingdom"],
        target_cities: ["Lagos", "Kano", "London", "Atlanta"]
    },

    // Technology & Services
    {
        business_name: "Naija Tech Solutions",
        title: "Web Development & Digital Marketing 💻",
        description: "Professional websites, mobile apps, and digital marketing for Nigerian businesses worldwide. Free consultation! #WebDev #DigitalMarketing #Nigeria",
        business_category: "technology",
        instagram_url: "https://instagram.com/naijatechsolutions",
        email: "info@naijatechsolutions.com",
        website_url: "https://naijatechsolutions.com",
        whatsapp_phone: "+234 808 123 4567",
        target_countries: ["Nigeria", "Ghana", "United States", "United Kingdom"],
        target_cities: ["Lagos", "Abuja", "London", "New York"]
    },
    {
        business_name: "RemitNaija",
        title: "Send Money to Nigeria Instantly 💸",
        description: "Fast, secure money transfers to Nigeria. Best exchange rates, 24/7 support. Download our app today! #MoneyTransfer #Nigeria #Remittance",
        business_category: "financial_services",
        instagram_url: "https://instagram.com/remitnaija",
        website_url: "https://remitnaija.com",
        target_countries: ["United States", "United Kingdom", "Canada"],
        target_cities: ["New York", "London", "Toronto", "Houston"]
    },

    // Healthcare & Wellness
    {
        business_name: "Dr. Adaora's Clinic",
        title: "Family Medicine & Wellness Center 🏥",
        description: "Comprehensive healthcare for the African community in Atlanta. Accepting new patients. Insurance accepted. #Healthcare #Atlanta #AfricanDoctor",
        business_category: "healthcare",
        instagram_url: "https://instagram.com/dradaorasclinic",
        phone: "+1 404 555 0167",
        website_url: "https://dradaorasclinic.com",
        target_countries: ["United States"],
        target_cities: ["Atlanta", "Decatur", "Stone Mountain"]
    },
    {
        business_name: "Wellness by Funmi",
        title: "Holistic Health & Nutrition Coaching 🌿",
        description: "Personalized nutrition plans combining modern science with traditional African wisdom. Virtual consultations available worldwide! #Nutrition #Wellness",
        business_category: "healthcare",
        instagram_url: "https://instagram.com/wellnessbyfunmi",
        whatsapp_phone: "+1 647 555 0123",
        website_url: "https://wellnessbyfunmi.com",
        target_countries: ["Canada", "United States", "Nigeria"],
        target_cities: ["Toronto", "Vancouver", "Lagos", "Abuja"]
    },

    // Real Estate & Property
    {
        business_name: "Lagos Property Pro",
        title: "Premium Real Estate in Lagos 🏠",
        description: "Buy, sell, rent properties in Lagos. Lekki, Victoria Island, Ikeja specialist. Virtual tours available for diaspora clients! #LagosRealEstate",
        business_category: "real_estate",
        instagram_url: "https://instagram.com/lagospropertypro",
        phone: "+234 801 234 5678",
        whatsapp_phone: "+234 801 234 5678",
        website_url: "https://lagospropertypro.ng",
        target_countries: ["Nigeria", "United States", "United Kingdom"],
        target_cities: ["Lagos", "Abuja", "London", "New York"]
    },
    {
        business_name: "Naija Homes UK",
        title: "Nigerian Property Investment UK 🏘️",
        description: "Helping Nigerians invest in UK property. From first-time buyers to property portfolio. Expert guidance & support. #UKProperty #Nigerian",
        business_category: "real_estate",
        instagram_url: "https://instagram.com/naijahomesuk",
        phone: "+44 20 7123 4567",
        email: "info@naijahomesuk.com",
        website_url: "https://naijahomesuk.com",
        target_countries: ["United Kingdom", "Nigeria"],
        target_cities: ["London", "Manchester", "Birmingham", "Lagos"]
    },

    // Education & Training
    {
        business_name: "Afrobeats Dance Academy",
        title: "Learn Afrobeats Dance Online 💃🏿",
        description: "Professional Afrobeats dance classes for all levels. Virtual and in-person classes in Toronto. Join our global dance family! #Afrobeats #Dance",
        business_category: "education",
        instagram_url: "https://instagram.com/afrobeatsdanceacademy",
        whatsapp_phone: "+1 647 888 9999",
        website_url: "https://afrobeatsdance.ca",
        target_countries: ["Canada", "United States"],
        target_cities: ["Toronto", "Ottawa", "Montreal", "New York"]
    },
    {
        business_name: "Igbo Language Institute",
        title: "Learn Igbo Language Online 📚",
        description: "Preserve our heritage! Interactive Igbo language classes for kids and adults. Native speakers, flexible schedules. #IgboLanguage #Heritage",
        business_category: "education",
        instagram_url: "https://instagram.com/igbolanguageinstitute",
        email: "learn@igbolanguage.org",
        website_url: "https://igbolanguage.org",
        target_countries: ["United States", "United Kingdom", "Canada", "Nigeria"],
        target_cities: ["New York", "London", "Toronto", "Lagos", "Aba"]
    },

    // Entertainment & Events
    {
        business_name: "Naija Events London",
        title: "Premier Nigerian Event Planning 🎉",
        description: "Weddings, birthdays, naming ceremonies, and corporate events. Making your special day unforgettable! Based in London. #NigerianWedding #Events",
        business_category: "events",
        instagram_url: "https://instagram.com/naijaeventslondon",
        phone: "+44 7456 789 123",
        whatsapp_phone: "+44 7456 789 123",
        website_url: "https://naijaeventslondon.co.uk",
        target_countries: ["United Kingdom"],
        target_cities: ["London", "Birmingham", "Manchester"]
    },
    {
        business_name: "Afrobeats Live NYC",
        title: "Afrobeats Concerts & Nightlife 🎵",
        description: "The hottest Afrobeats events in NYC! Live concerts, DJ sets, and cultural celebrations. Follow for event updates! #Afrobeats #NYC #Nightlife",
        business_category: "entertainment",
        instagram_url: "https://instagram.com/afrobeatslivenyc",
        website_url: "https://afrobeatslivenyc.com",
        target_countries: ["United States"],
        target_cities: ["New York", "Brooklyn", "Queens", "New Jersey"]
    },

    // Import/Export & Shipping
    {
        business_name: "Ship2Naija Express",
        title: "Reliable Shipping to Nigeria 📦",
        description: "Fast, secure shipping from USA/UK to Nigeria. Cars, containers, personal items. Door-to-door service. Track your shipment online! #Shipping #Nigeria",
        business_category: "shipping_logistics",
        instagram_url: "https://instagram.com/ship2naijaexpress",
        phone: "+1 888 SHIP-2-NG",
        whatsapp_phone: "+1 713 555 SHIP",
        website_url: "https://ship2naijaexpress.com",
        target_countries: ["United States", "United Kingdom"],
        target_cities: ["Houston", "New York", "London", "Birmingham"]
    },
    {
        business_name: "Afro Grocery Express",
        title: "African Foods Delivered 🛒",
        description: "African groceries, spices, and ingredients delivered to your door in Toronto. Same-day delivery available! Shop online. #AfricanGroceries #Toronto",
        business_category: "retail",
        instagram_url: "https://instagram.com/afrogroceryexpress",
        phone: "+1 416 AFRO-GRO",
        whatsapp_phone: "+1 416 275 6476",
        website_url: "https://afrogroceryexpress.ca",
        target_countries: ["Canada"],
        target_cities: ["Toronto", "Mississauga", "Brampton", "Ottawa"]
    },

    // Professional Services
    {
        business_name: "Naija Legal Services",
        title: "Immigration & Legal Services ⚖️",
        description: "Expert immigration lawyer specializing in Nigerian cases. Visas, citizenship, family reunification. Free initial consultation. #Immigration #Legal",
        business_category: "professional_services",
        instagram_url: "https://instagram.com/naijalegalservices",
        phone: "+1 212 555 LAW1",
        email: "info@naijalegal.com",
        website_url: "https://naijalegal.com",
        target_countries: ["United States"],
        target_cities: ["New York", "New Jersey", "Connecticut"]
    },
    {
        business_name: "African Tax Pro",
        title: "Tax Services for Nigerians Abroad 📊",
        description: "Expert tax preparation for Nigerian diaspora. US, UK, Canadian tax returns. Maximize your refunds! CPA certified. #TaxServices #Nigerian #CPA",
        business_category: "professional_services",
        instagram_url: "https://instagram.com/africantaxpro",
        phone: "+1 647 TAX HELP",
        website_url: "https://africantaxpro.com",
        target_countries: ["Canada", "United States"],
        target_cities: ["Toronto", "Calgary", "Vancouver", "New York"]
    }
];

function generateAdImage(businessName, category) {
    // Generate relevant images based on business category
    const imageTemplates = {
        food_restaurant: [
            "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=600&h=400&fit=crop", // Nigerian food
            "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&h=400&fit=crop", // Restaurant food
            "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600&h=400&fit=crop", // African food
            "https://via.placeholder.com/600x400/FF6B35/FFFFFF?text=" + encodeURIComponent(businessName)
        ],
        fashion_beauty: [
            "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=600&h=400&fit=crop", // African fashion
            "https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=600&h=400&fit=crop", // Beauty
            "https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=600&h=400&fit=crop", // Fashion
            "https://via.placeholder.com/600x400/E91E63/FFFFFF?text=" + encodeURIComponent(businessName)
        ],
        technology: [
            "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=600&h=400&fit=crop", // Tech team
            "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=600&h=400&fit=crop", // Laptops
            "https://via.placeholder.com/600x400/2196F3/FFFFFF?text=" + encodeURIComponent(businessName)
        ],
        healthcare: [
            "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=600&h=400&fit=crop", // Healthcare
            "https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=600&h=400&fit=crop", // Doctor
            "https://via.placeholder.com/600x400/4CAF50/FFFFFF?text=" + encodeURIComponent(businessName)
        ],
        real_estate: [
            "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600&h=400&fit=crop", // Modern house
            "https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=600&h=400&fit=crop", // Property
            "https://via.placeholder.com/600x400/FF9800/FFFFFF?text=" + encodeURIComponent(businessName)
        ],
        education: [
            "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=600&h=400&fit=crop", // Education
            "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600&h=400&fit=crop", // Learning
            "https://via.placeholder.com/600x400/9C27B0/FFFFFF?text=" + encodeURIComponent(businessName)
        ],
        default: [
            "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&h=400&fit=crop", // Business
            "https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=600&h=400&fit=crop", // Startup
            "https://via.placeholder.com/600x400/607D8B/FFFFFF?text=" + encodeURIComponent(businessName)
        ]
    };
    
    const categoryImages = imageTemplates[category] || imageTemplates.default;
    return randomChoice(categoryImages);
}

function generateLogo(businessName) {
    const colors = ['FF6B35', 'E91E63', '2196F3', '4CAF50', 'FF9800', '9C27B0', '607D8B', '795548'];
    const color = randomChoice(colors);
    const initials = businessName.split(' ').map(word => word[0]).join('').substring(0, 3).toUpperCase();
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&size=100&background=${color}&color=FFFFFF&bold=true&format=png`;
}

async function generateAds(count = 50) {
    console.log(`🎯 Generating ${count} Nigerian business demo ads...`);
    
    const ads = [];
    const positions = ['sidebar', 'header', 'footer', 'inline'];
    const adTypes = ['banner', 'square', 'sponsored'];
    
    // Use each business multiple times with variations
    for (let i = 0; i < count; i++) {
        const business = randomChoice(nigerianBusinesses);
        
        const ad = {
            title: business.title,
            description: business.description,
            business_name: business.business_name,
            business_category: business.business_category,
            image_url: generateAdImage(business.business_name, business.business_category),
            logo_url: generateLogo(business.business_name),
            website_url: business.website_url || null,
            instagram_url: business.instagram_url,
            whatsapp_phone: business.whatsapp_phone || null,
            phone: business.phone || null,
            email: business.email || null,
            target_countries: business.target_countries,
            target_cities: business.target_cities,
            ad_type: randomChoice(adTypes),
            position: randomChoice(positions),
            priority: Math.floor(Math.random() * 10) + 1,
            status: Math.random() > 0.1 ? 'active' : 'paused',
            start_date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Within last 30 days
            end_date: new Date(Date.now() + Math.random() * 90 * 24 * 60 * 60 * 1000), // Within next 90 days
            budget_daily: Math.floor(Math.random() * 200) + 50, // $50-$250 per day
            cost_per_click: (Math.random() * 2 + 0.5).toFixed(2), // $0.50-$2.50 per click
            impressions: Math.floor(Math.random() * 50000) + 1000,
            clicks: Math.floor(Math.random() * 500) + 10,
            conversions: Math.floor(Math.random() * 20) + 1
        };
        
        ads.push(ad);
    }
    
    console.log(`✅ Generated ${ads.length} demo ads`);
    return ads;
}

async function insertAds(ads) {
    console.log(`🔄 Inserting ${ads.length} ads into database...`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const ad of ads) {
        try {
            await pool.query(`
                INSERT INTO advertisements (
                    title, description, business_name, business_category,
                    image_url, logo_url, website_url, instagram_url,
                    whatsapp_phone, phone, email, target_countries, target_cities,
                    ad_type, position, priority, status, start_date, end_date,
                    budget_daily, cost_per_click, impressions, clicks, conversions
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13,
                    $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24
                )
            `, [
                ad.title, ad.description, ad.business_name, ad.business_category,
                ad.image_url, ad.logo_url, ad.website_url, ad.instagram_url,
                ad.whatsapp_phone, ad.phone, ad.email, ad.target_countries, ad.target_cities,
                ad.ad_type, ad.position, ad.priority, ad.status, ad.start_date, ad.end_date,
                ad.budget_daily, ad.cost_per_click, ad.impressions, ad.clicks, ad.conversions
            ]);
            
            successCount++;
            
            if (successCount % 10 === 0) {
                console.log(`📊 Inserted ${successCount}/${ads.length} ads...`);
            }
            
        } catch (error) {
            errorCount++;
            console.error(`❌ Failed to insert ad for "${ad.business_name}":`, error.message);
        }
    }
    
    return { successCount, errorCount };
}

async function seedAds(count = 50) {
    try {
        console.log('🎯 Starting Nigerian business ads seeding...');
        
        // Generate ads
        const ads = await generateAds(count);
        
        // Insert ads
        const { successCount, errorCount } = await insertAds(ads);
        
        console.log(`\\n📊 Ads seeding completed:`);
        console.log(`✅ Successfully inserted: ${successCount} ads`);
        console.log(`❌ Failed: ${errorCount} ads`);
        
        // Show statistics
        const stats = await pool.query(`
            SELECT 
                business_category,
                COUNT(*) as count,
                AVG(impressions) as avg_impressions,
                AVG(clicks) as avg_clicks
            FROM advertisements 
            GROUP BY business_category 
            ORDER BY count DESC
        `);
        
        const positionStats = await pool.query(`
            SELECT position, COUNT(*) as count 
            FROM advertisements 
            GROUP BY position 
            ORDER BY count DESC
        `);
        
        const activeAds = await pool.query('SELECT COUNT(*) FROM advertisements WHERE status = \'active\'');
        
        console.log(`\\n📈 Ad Statistics:`);
        console.log(`Total ads: ${successCount}`);
        console.log(`Active ads: ${activeAds.rows[0].count}`);
        console.log(`\\nAds by category:`);
        console.table(stats.rows);
        console.log(`\\nAds by position:`);
        console.table(positionStats.rows);
        
        // Show sample ads
        const samples = await pool.query(`
            SELECT business_name, title, business_category, position, impressions, clicks
            FROM advertisements 
            ORDER BY impressions DESC 
            LIMIT 5
        `);
        
        console.log(`\\n🎯 Top performing sample ads:`);
        console.table(samples.rows);
        
    } catch (error) {
        console.error('❌ Ads seeding failed:', error);
    } finally {
        await pool.end();
        process.exit(0);
    }
}

// Run the seeder
if (require.main === module) {
    const count = parseInt(process.argv[2]) || 30;
    console.log(`🎯 Seeding database with ${count} Nigerian business ads...`);
    seedAds(count);
}

module.exports = { seedAds, generateAds, insertAds };