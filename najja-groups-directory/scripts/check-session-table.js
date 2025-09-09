require('dotenv').config();

const pool = require('../config/database');

async function checkSessionTable() {
    try {
        console.log('🔍 Checking session table...');
        
        // Check if session table exists
        const tableCheck = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'session'
        `);
        
        if (tableCheck.rows.length === 0) {
            console.log('❌ Session table does not exist!');
            console.log('💡 Creating session table...');
            
            // Create session table
            await pool.query(`
                CREATE TABLE "session" (
                    "sid" varchar NOT NULL COLLATE "default",
                    "sess" json NOT NULL,
                    "expire" timestamp(6) NOT NULL
                )
                WITH (OIDS=FALSE);
                
                ALTER TABLE "session" ADD CONSTRAINT "session_pkey" PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE;
                CREATE INDEX "IDX_session_expire" ON "session" ("expire");
            `);
            
            console.log('✅ Session table created successfully!');
        } else {
            console.log('✅ Session table exists');
            
            // Check table structure
            const columns = await pool.query(`
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = 'session'
                ORDER BY ordinal_position
            `);
            
            console.log('📋 Table columns:');
            columns.rows.forEach(col => {
                console.log(`   - ${col.column_name}: ${col.data_type}`);
            });
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await pool.end();
    }
}

checkSessionTable();