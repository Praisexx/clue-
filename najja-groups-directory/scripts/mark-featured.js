const pool = require('../config/database');

async function markGroupFeatured() {
    try {
        const result = await pool.query(
            'UPDATE groups SET featured = true WHERE name = $1 RETURNING name',
            ['Test Nigerian Group']
        );
        
        if (result.rows.length > 0) {
            console.log('✅ Test group marked as featured');
        } else {
            console.log('⚠️  Group not found');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await pool.end();
    }
}

markGroupFeatured();