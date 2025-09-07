const pool = require('../config/database');

async function checkGroupLogos() {
    try {
        // Check a few groups for their logo_url
        const result = await pool.query(`
            SELECT slug, name, logo_url 
            FROM groups 
            WHERE slug LIKE '%hausa-community%' OR slug LIKE '%church%' OR slug LIKE '%university%'
            ORDER BY id DESC
            LIMIT 5
        `);
        
        console.log('📋 Group Logo Status:');
        result.rows.forEach(group => {
            console.log(`- ${group.name}`);
            console.log(`  Slug: ${group.slug}`);
            console.log(`  Logo: ${group.logo_url || 'No logo'}`);
            console.log('');
        });
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await pool.end();
    }
}

checkGroupLogos();