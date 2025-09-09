require('dotenv').config();

const bcrypt = require('bcrypt');
const pool = require('../config/database');

async function checkAndCreateAdmin() {
    try {
        console.log('🔍 Checking admin user in database...');
        console.log('Database:', process.env.DATABASE_URL ? 'Production (Render)' : 'Local');
        
        const email = 'yukiwolford7@gmail.com';
        const username = 'ace';
        const password = 'chukwudi';
        
        // Check if admin already exists
        const existingAdmin = await pool.query(
            'SELECT * FROM admins WHERE email = $1 OR username = $2',
            [email, username]
        );
        
        if (existingAdmin.rows.length > 0) {
            console.log('✅ Admin user already exists!');
            console.log('📧 Email:', existingAdmin.rows[0].email);
            console.log('👤 Username:', existingAdmin.rows[0].username);
            console.log('🆔 ID:', existingAdmin.rows[0].id);
            return;
        }
        
        console.log('❌ Admin user not found. Creating new admin...');
        
        // Hash the password
        const saltRounds = 10;
        const password_hash = await bcrypt.hash(password, saltRounds);
        
        // Create admin user
        const result = await pool.query(
            'INSERT INTO admins (email, username, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING *',
            [email, username, password_hash, 'admin']
        );
        
        console.log('🎉 Admin user created successfully!');
        console.log('📧 Email:', email);
        console.log('👤 Username:', username);
        console.log('🔐 Password:', password);
        console.log('🆔 ID:', result.rows[0].id);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        
        if (error.message.includes('relation "admins" does not exist')) {
            console.log('\n💡 It looks like the admins table doesn\'t exist.');
            console.log('   You need to run the database migrations first.');
            console.log('   Check if you have migration files in the migrations/ folder.');
        }
        
        process.exit(1);
    } finally {
        await pool.end();
    }
}

checkAndCreateAdmin();