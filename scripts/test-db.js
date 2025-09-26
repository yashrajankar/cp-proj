// scripts/test-db.js
// Script to test database connection

const { pool, testConnection } = require('../config/db');

async function testDatabase() {
  console.log('Testing database connection...');
  
  try {
    // Test basic connection
    const isConnected = await testConnection();
    
    if (isConnected) {
      console.log('✅ Database connection successful!');
      
      // Test a simple query
      const connection = await pool.getConnection();
      try {
        const [rows] = await connection.execute('SELECT 1 as test');
        console.log('✅ Database query test successful:', rows[0]);
      } finally {
        connection.release();
      }
      
      // Show database status
      const [dbRows] = await connection.execute('SELECT DATABASE() as databaseName');
      console.log('Current database:', dbRows[0].databaseName);
      
      // Show tables
      const [tables] = await connection.execute('SHOW TABLES');
      console.log('Tables in database:', tables.map(table => Object.values(table)[0]));
      
    } else {
      console.log('❌ Database connection failed');
    }
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    process.exit(1);
  }
}

// Run test if script is called directly
if (require.main === module) {
  testDatabase().then(() => {
    process.exit(0);
  });
}

module.exports = testDatabase;