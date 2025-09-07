const bcrypt = require('bcrypt');
const pool = require('../config/database');

async function updateAdmin() {
    try {
        const newEmail = 'cpraise142@gmail.com';
        const newPassword = 'chukwudi';
        const newUsername = 'ace'; // Note: Need to add username column if you want to use this
        
        // Hash the new password
        const saltRounds = 10;
        const password_hash = await bcrypt.hash(newPassword, saltRounds);
        
        // Update the admin user
        const result = await pool.query(
            'UPDATE admins SET email = $1, password_hash = $2 WHERE email = $3 RETURNING id, email',
            [newEmail, password_hash, 'admin@naija-groups.com']
        );
        
        if (result.rows.length > 0) {
            console.log('✅ Admin user updated successfully!');
            console.log('📧 New Email:', newEmail);
            console.log('🔐 New Password:', newPassword);
            console.log('👤 Username: ace (note: username field not in database yet)');
        } else {
            console.log('⚠️ Admin user not found');
        }
        
    } catch (error) {
        console.error('❌ Failed to update admin user:', error.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

updateAdmin();