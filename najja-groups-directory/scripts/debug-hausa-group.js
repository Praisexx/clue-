const pool = require('../config/database');

async function debugHausaGroup() {
    try {
        // Check direct database query
        console.log('🔍 Direct database query for Hausa groups:');
        const dbResult = await pool.query(`
            SELECT slug, name, logo_url 
            FROM groups 
            WHERE name LIKE '%Hausa Community - Abuja%'
        `);
        
        console.log('Database results:');
        dbResult.rows.forEach(row => {
            console.log(`- Name: ${row.name}`);
            console.log(`  Slug: ${row.slug}`);
            console.log(`  Logo URL: "${row.logo_url}"`);
            console.log('');
        });
        
        // Test the Group model method
        const Group = require('../models/Group');
        console.log('\n🔍 Testing Group.getBySlug method:');
        
        if (dbResult.rows.length > 0) {
            const slug = dbResult.rows[0].slug;
            console.log('Using slug:', slug);
            
            const group = await Group.getBySlug(slug);
            if (group) {
                console.log('✅ Group model returned:');
                console.log(`- Name: ${group.name}`);
                console.log(`- Logo URL: "${group.logo_url}"`);
            } else {
                console.log('❌ Group model returned null');
            }
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await pool.end();
    }
}

debugHausaGroup();