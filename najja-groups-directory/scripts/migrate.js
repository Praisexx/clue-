const fs = require('fs');
const path = require('path');
const pool = require('../config/database');

async function runMigrations() {
    try {
        console.log('🔄 Starting database migrations...');
        
        const migrationsPath = path.join(__dirname, '../migrations');
        const migrationFiles = fs.readdirSync(migrationsPath)
            .filter(file => file.endsWith('.sql'))
            .sort();

        for (const file of migrationFiles) {
            console.log(`📄 Running migration: ${file}`);
            
            const migrationSQL = fs.readFileSync(
                path.join(migrationsPath, file), 
                'utf8'
            );
            
            await pool.query(migrationSQL);
            console.log(`✅ Migration ${file} completed successfully`);
        }
        
        console.log('🎉 All migrations completed successfully!');
        
        // Test basic queries
        console.log('\n🔍 Testing database setup...');
        const result = await pool.query('SELECT COUNT(*) FROM groups');
        console.log(`✅ Groups table ready (${result.rows[0].count} records)`);
        
        const adminResult = await pool.query('SELECT COUNT(*) FROM admins');
        console.log(`✅ Admins table ready (${adminResult.rows[0].count} records)`);
        
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

runMigrations();