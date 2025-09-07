const pool = require('../config/database');

async function setUsername() {
    try {
        // Update the admin user to add username
        const result = await pool.query(
            'UPDATE admins SET username = $1 WHERE email = $2 RETURNING id, email, username',
            ['ace', 'cpraise142@gmail.com']
        );
        
        if (result.rows.length > 0) {
            console.log('✅ Username set successfully!');
            console.log('👤 Username:', result.rows[0].username);
            console.log('📧 Email:', result.rows[0].email);
        } else {
            console.log('⚠️ Admin user not found');
        }
        
    } catch (error) {
        console.error('❌ Failed to set username:', error.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

setUsername();