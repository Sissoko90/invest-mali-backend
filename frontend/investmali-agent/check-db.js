const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || process.env.USER,
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'investmali_dev',
  password: process.env.DB_PASSWORD || '',
  port: process.env.DB_PORT || 5432,
});

async function checkAgentUsers() {
  try {
    const client = await pool.connect();
    console.log('✅ Connected to PostgreSQL');
    
    const result = await client.query(
      "SELECT id, email, first_name, last_name, role, is_active FROM users WHERE role = 'agent'"
    );
    
    console.log('\nAgent Users:');
    console.table(result.rows);
    
    if (result.rows.length === 0) {
      console.log('\nNo agent users found. You may need to create one first.');
    }
    
    client.release();
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

checkAgentUsers();
