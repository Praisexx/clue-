require('dotenv').config();

const bcrypt = require('bcrypt');
const pool = require('../config/database');

async function createAdminUser() {
    try {
        const email = 'yukiwolford7@gmail.com';
        const username = 'ace';
        const password = 'chukwudi';
        
        // Hash the password
        const saltRounds = 10;
        const password_hash = await bcrypt.hash(password, saltRounds);
        
        // Check if admin already exists
        const existingAdmin = await pool.query(
            'SELECT * FROM admins WHERE email = $1 OR username = $2',
            [email, username]
        );
        
        if (existingAdmin.rows.length > 0) {
            console.log('⚠️  Admin user already exists!');
            return;
        }
        
        // Create admin user
        const result = await pool.query(
            'INSERT INTO admins (email, username, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING *',
            [email, username, password_hash, 'admin']
        );
        
        console.log('🎉 Admin user created successfully!');
        console.log('📧 Email:', email);
        console.log('👤 Username:', username);
        console.log('🔐 Password:', password);
        
    } catch (error) {
        console.error('❌ Failed to create admin user:', error.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

createAdminUser();