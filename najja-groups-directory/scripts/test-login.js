require('dotenv').config();

const Admin = require('../models/Admin');

async function testLogin() {
    try {
        console.log('🔍 Testing admin login...');
        
        const username = 'ace';
        const password = 'chukwudi';
        
        console.log(`Attempting login with username: ${username}`);
        
        const admin = await Admin.authenticate(username, password);
        
        if (admin) {
            console.log('✅ Login successful!');
            console.log('Admin data:', {
                id: admin.id,
                email: admin.email,
                username: admin.username,
                role: admin.role
            });
        } else {
            console.log('❌ Login failed - invalid credentials');
        }
        
    } catch (error) {
        console.error('❌ Login error:', error.message);
    } finally {
        process.exit(0);
    }
}

testLogin();