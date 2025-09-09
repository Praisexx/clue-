const { Pool } = require('pg');
require('dotenv').config();

// Current database connection (from .env)
const newDb = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('render.com') ? { rejectUnauthorized: false } : false
});

// OLD database connection (you need to provide these credentials)
// Update these with your old database details:
const oldDb = new Pool({
    connectionString: 'YOUR_OLD_DATABASE_URL_HERE',
    // OR individual connection details:
    // host: 'old-db-host',
    // port: 5432,
    // database: 'old-db-name',
    // user: 'old-username',
    // password: 'old-password',
    // ssl: false // or { rejectUnauthorized: false }
});

async function migrateGroups() {
    try {
        console.log('🔄 Starting data migration from old database...');
        
        // Connect to both databases
        console.log('📡 Connecting to old database...');
        await oldDb.connect();
        console.log('✅ Connected to old database');
        
        console.log('📡 Connecting to new database...');
        await newDb.connect();
        console.log('✅ Connected to new database');
        
        // Fetch data from old database
        // CUSTOMIZE THIS QUERY based on your old table structure:
        console.log('📊 Fetching groups from old database...');
        const oldGroups = await oldDb.query(`
            SELECT 
                -- Map your old columns to new structure
                -- id,
                name,
                -- slug, -- might need to generate this
                description,
                city,
                country,
                -- region,
                phone,
                email,
                website,
                -- categories,
                -- founded_year,
                -- member_size,
                -- membership_type,
                -- meeting_days,
                -- lat,
                -- lng,
                -- logo_url,
                created_at
            FROM your_old_groups_table_name
            ORDER BY id
        `);
        
        console.log(`📈 Found ${oldGroups.rows.length} groups in old database`);
        
        if (oldGroups.rows.length === 0) {
            console.log('❌ No groups found in old database');
            return;
        }
        
        // Helper function to generate slug from name
        function generateSlug(name) {
            return name
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)/g, '');
        }
        
        // Migrate each group
        let successCount = 0;
        let errorCount = 0;
        
        for (const oldGroup of oldGroups.rows) {
            try {
                console.log(`🔄 Migrating: ${oldGroup.name}`);
                
                // Generate slug if not present
                const slug = oldGroup.slug || generateSlug(oldGroup.name);
                
                // Check if group already exists (by slug or name)
                const existingGroup = await newDb.query(
                    'SELECT id FROM groups WHERE slug = $1 OR name = $2',
                    [slug, oldGroup.name]
                );
                
                if (existingGroup.rows.length > 0) {
                    console.log(`⚠️  Group "${oldGroup.name}" already exists, skipping`);
                    continue;
                }
                
                // Insert into new database
                // CUSTOMIZE THIS INSERT based on what fields you have:
                await newDb.query(`
                    INSERT INTO groups (
                        slug, name, description, city, country, 
                        phone, email, website, status, created_at
                        -- Add other fields as needed
                    ) VALUES (
                        $1, $2, $3, $4, $5, 
                        $6, $7, $8, 'approved', $9
                        -- Add corresponding values
                    )
                `, [
                    slug,
                    oldGroup.name,
                    oldGroup.description || null,
                    oldGroup.city || null,
                    oldGroup.country || null,
                    oldGroup.phone || null,
                    oldGroup.email || null,
                    oldGroup.website || null,
                    oldGroup.created_at || new Date()
                ]);
                
                successCount++;
                console.log(`✅ Migrated: ${oldGroup.name}`);
                
            } catch (error) {
                errorCount++;
                console.error(`❌ Failed to migrate "${oldGroup.name}":`, error.message);
            }
        }
        
        console.log(`\n📊 Migration completed:`);
        console.log(`✅ Successfully migrated: ${successCount} groups`);
        console.log(`❌ Failed: ${errorCount} groups`);
        
        // Verify the migration
        const finalCount = await newDb.query('SELECT COUNT(*) FROM groups');
        console.log(`📈 Total groups in new database: ${finalCount.rows[0].count}`);
        
    } catch (error) {
        console.error('❌ Migration failed:', error);
    } finally {
        // Close connections
        await oldDb.end();
        await newDb.end();
        console.log('🔐 Database connections closed');
        process.exit(0);
    }
}

// Run the migration
if (require.main === module) {
    migrateGroups();
}

module.exports = { migrateGroups };