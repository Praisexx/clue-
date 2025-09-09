const { Pool } = require('pg');
require('dotenv').config();
console.log('Database URL:', process.env.DATABASE_URL); // Check if the URL is loaded

// Create a new Pool instance using the connection string from .env
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // Add this for ElephantSQL or other cloud providers to avoid error:
    ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('render.com') ? { rejectUnauthorized: false } : false
});

// Test the connection immediately
pool.connect((err, client, release) => {
    if (err) {
        return console.error('Error acquiring client', err.stack);
    }
    console.log('? Successfully connected to the database.');
    release(); // Release the client back to the pool
});
// Add error handling for the pool
pool.on('error', (err) => {
    console.error('Unexpected database pool error:', err);
    process.exit(-1);
});
// Export the pool so we can use it in our models
module.exports = pool;
