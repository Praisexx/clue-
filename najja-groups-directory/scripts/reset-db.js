const pool = require('../config/database');

async function resetDatabase() {
    try {
        console.log('⚠️  RESETTING DATABASE - All data will be lost!');
        
        // Drop tables in correct order (child tables first)
        const dropCommands = [
            'DROP TABLE IF EXISTS contact_messages CASCADE;',
            'DROP TABLE IF EXISTS media CASCADE;', 
            'DROP TABLE IF EXISTS groups CASCADE;',
            'DROP TABLE IF EXISTS admins CASCADE;'
        ];
        
        for (const cmd of dropCommands) {
            await pool.query(cmd);
            console.log(`✅ Executed: ${cmd}`);
        }
        
        console.log('🎉 Database reset completed successfully!');
        
    } catch (error) {
        console.error('❌ Reset failed:', error.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

resetDatabase();