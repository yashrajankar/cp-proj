// restore-old-database.js
// Script to restore the old database with all tables and relationships

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function restoreOldDatabase() {
  try {
    console.log('Restoring old database from schema...');
    
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'aicn_user',
      password: process.env.DB_PASSWORD || 'SecurePass123!',
      database: process.env.DB_NAME || 'aicn_app_db',
      ssl: false
    });

    // Read the schema file
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Split the schema into individual statements
    const statements = schema.split(';').filter(stmt => stmt.trim() !== '');
    
    console.log(`Found ${statements.length} statements in schema`);
    
    let successCount = 0;
    let errorCount = 0;
    
    // Execute each statement
    for (const [index, statement] of statements.entries()) {
      const trimmed = statement.trim();
      if (trimmed) {
        try {
          await connection.execute(trimmed);
          console.log(`✅ Statement ${index + 1} executed successfully`);
          successCount++;
        } catch (err) {
          // Some errors might be because tables already exist or foreign key issues
          if (err.message.includes('already exists') || err.code === 'ER_TABLE_EXISTS_ERROR') {
            console.log(`⚠️  Statement ${index + 1}: Table already exists (this is OK)`);
            successCount++;
          } else {
            console.log(`❌ Error executing statement ${index + 1}:`, err.message.substring(0, 100));
            errorCount++;
          }
        }
      }
    }
    
    await connection.end();
    
    console.log(`\n📊 Restoration Summary:`);
    console.log(`   ✅ Successfully executed: ${successCount} statements`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   📋 Total processed: ${statements.length} statements`);
    
    if (errorCount === 0) {
      console.log(`\n🎉 Database restoration completed successfully!`);
    } else {
      console.log(`\n⚠️  Database restoration completed with some warnings.`);
    }
    
  } catch (error) {
    console.error('❌ Failed to restore database:', error.message);
    console.error('Error code:', error.code);
  }
}

// Run if called directly
if (require.main === module) {
  restoreOldDatabase().then(() => {
    process.exit(0);
  });
}

module.exports = restoreOldDatabase;