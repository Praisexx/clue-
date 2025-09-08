const fs = require('fs');
const path = require('path');
const db = require('./config/database');

async function runMigration(migrationFile) {
    try {
        console.log(`🔄 Running migration: ${migrationFile}`);
        
        const migrationPath = path.join(__dirname, 'migrations', migrationFile);
        const sql = fs.readFileSync(migrationPath, 'utf8');
        
        await db.query(sql);
        
        console.log(`✅ Migration completed successfully: ${migrationFile}`);
        
    } catch (error) {
        console.error(`❌ Migration failed: ${migrationFile}`, error);
        throw error;
    }
}

// Run the analytics tables migration
runMigration('009_create_analytics_tables.sql')
    .then(() => {
        console.log('🎉 All migrations completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('💥 Migration failed:', error);
        process.exit(1);
    });