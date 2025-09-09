const fs = require('fs');
const { Pool } = require('pg');
require('dotenv').config();

// Current database connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('render.com') ? { rejectUnauthorized: false } : false
});

async function importFromBackup(filePath) {
    try {
        console.log('📂 Reading backup file:', filePath);
        
        // Check if file exists
        if (!fs.existsSync(filePath)) {
            throw new Error(`Backup file not found: ${filePath}`);
        }
        
        const fileContent = fs.readFileSync(filePath, 'utf8');
        
        // Parse based on file type
        let groupsData;
        
        if (filePath.endsWith('.json')) {
            console.log('📄 Parsing JSON backup...');
            groupsData = JSON.parse(fileContent);
            
            // Handle different JSON structures
            if (Array.isArray(groupsData)) {
                // Direct array of groups
                groupsData = groupsData;
            } else if (groupsData.groups && Array.isArray(groupsData.groups)) {
                // Groups under 'groups' key
                groupsData = groupsData.groups;
            } else if (groupsData.data && Array.isArray(groupsData.data)) {
                // Groups under 'data' key
                groupsData = groupsData.data;
            } else {
                throw new Error('Unknown JSON structure. Expected array of groups.');
            }
            
        } else if (filePath.endsWith('.csv')) {
            console.log('📄 Parsing CSV backup...');
            const lines = fileContent.split('\\n').filter(line => line.trim());
            const headers = lines[0].split(',').map(h => h.trim());
            
            groupsData = lines.slice(1).map(line => {
                const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
                const group = {};
                headers.forEach((header, index) => {
                    group[header] = values[index] || null;
                });
                return group;
            });
            
        } else if (filePath.endsWith('.sql')) {
            console.log('📄 SQL backup detected - please run this manually:');
            console.log('psql $DATABASE_URL < ' + filePath);
            return;
        } else {
            throw new Error('Unsupported file format. Use .json, .csv, or .sql');
        }
        
        console.log(`📊 Found ${groupsData.length} groups in backup`);
        
        if (groupsData.length === 0) {
            console.log('❌ No groups found in backup file');
            return;
        }
        
        // Helper function to generate slug
        function generateSlug(name) {
            if (!name) return 'unnamed-group';
            return name
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)/g, '') || 'unnamed-group';
        }
        
        // Import each group
        let successCount = 0;
        let errorCount = 0;
        
        for (const groupData of groupsData) {
            try {
                const name = groupData.name || groupData.title || groupData.group_name;
                if (!name) {
                    console.log('⚠️  Skipping group without name:', groupData);
                    continue;
                }
                
                console.log(`🔄 Importing: ${name}`);
                
                // Generate slug
                const slug = generateSlug(name);
                
                // Check if group already exists
                const existingGroup = await pool.query(
                    'SELECT id FROM groups WHERE slug = $1 OR name = $2',
                    [slug, name]
                );
                
                if (existingGroup.rows.length > 0) {
                    console.log(`⚠️  Group "${name}" already exists, skipping`);
                    continue;
                }
                
                // Parse categories if it's a string
                let categories = groupData.categories;
                if (typeof categories === 'string') {
                    try {
                        categories = JSON.parse(categories);
                    } catch {
                        categories = categories.split(',').map(c => c.trim()).filter(c => c);
                    }
                }
                if (!Array.isArray(categories)) categories = null;
                
                // Parse meeting_days if it's a string
                let meetingDays = groupData.meeting_days;
                if (typeof meetingDays === 'string') {
                    try {
                        meetingDays = JSON.parse(meetingDays);
                    } catch {
                        meetingDays = meetingDays.split(',').map(d => d.trim()).filter(d => d);
                    }
                }
                if (!Array.isArray(meetingDays)) meetingDays = null;
                
                // Insert group
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
                    slug,
                    name,
                    groupData.description || null,
                    groupData.address || null,
                    groupData.city || null,
                    groupData.region || null,
                    groupData.country || null,
                    parseFloat(groupData.lat) || null,
                    parseFloat(groupData.lng) || null,
                    groupData.phone || null,
                    groupData.email || null,
                    groupData.website || null,
                    groupData.whatsapp_phone || groupData.whatsapp || null,
                    categories,
                    meetingDays,
                    parseInt(groupData.founded_year) || null,
                    parseInt(groupData.member_size) || null,
                    groupData.membership_type || null,
                    groupData.featured === 'true' || groupData.featured === true || false,
                    groupData.status || 'approved',
                    groupData.logo_url || null,
                    groupData.facebook_url || groupData.facebook || null,
                    groupData.instagram_url || groupData.instagram || null,
                    groupData.twitter_url || groupData.twitter || null,
                    groupData.linkedin_url || groupData.linkedin || null,
                    groupData.youtube_url || groupData.youtube || null,
                    groupData.created_at ? new Date(groupData.created_at) : new Date()
                ]);
                
                successCount++;
                console.log(`✅ Imported: ${name}`);
                
            } catch (error) {
                errorCount++;
                console.error(`❌ Failed to import group:`, error.message);
                console.error('Group data:', groupData);
            }
        }
        
        console.log(`\\n📊 Import completed:`);
        console.log(`✅ Successfully imported: ${successCount} groups`);
        console.log(`❌ Failed: ${errorCount} groups`);
        
        // Show final count
        const finalCount = await pool.query('SELECT COUNT(*) FROM groups');
        console.log(`📈 Total groups in database: ${finalCount.rows[0].count}`);
        
    } catch (error) {
        console.error('❌ Import failed:', error);
    } finally {
        await pool.end();
        process.exit(0);
    }
}

// Usage
if (require.main === module) {
    const filePath = process.argv[2];
    if (!filePath) {
        console.log('Usage: node import-from-backup.js <backup-file>');
        console.log('Supported formats: .json, .csv, .sql');
        console.log('Example: node import-from-backup.js groups-backup.json');
        process.exit(1);
    }
    
    importFromBackup(filePath);
}

module.exports = { importFromBackup };