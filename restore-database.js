// restore-database.js
// Script to restore all missing tables from the schema

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function restoreDatabase() {
  try {
    console.log('Restoring database tables from schema...');
    
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
    
    // Extract CREATE TABLE statements
    const createTableRegex = /CREATE TABLE IF NOT EXISTS[\s\S]*?;/g;
    const createTableStatements = schema.match(createTableRegex) || [];
    
    console.log(`Found ${createTableStatements.length} CREATE TABLE statements`);
    
    let successCount = 0;
    let errorCount = 0;
    
    // Execute each CREATE TABLE statement
    for (const stmt of createTableStatements) {
      const trimmed = stmt.trim();
      if (trimmed) {
        const tableNameMatch = trimmed.match(/CREATE TABLE IF NOT EXISTS\s+\`(\w+)\`/);
        if (tableNameMatch) {
          const tableName = tableNameMatch[1];
          try {
            await connection.execute(trimmed);
            console.log(`✅ Created table: ${tableName}`);
            successCount++;
          } catch (err) {
            // Some errors might be because tables already exist or foreign key issues
            if (err.message.includes('already exists') || err.code === 'ER_TABLE_EXISTS_ERROR') {
              console.log(`⚠️  Table already exists: ${tableName}`);
              successCount++;
            } else {
              console.log(`❌ Error creating table ${tableName}:`, err.message.substring(0, 100));
              errorCount++;
            }
          }
        }
      }
    }
    
    // Create indexes if they don't exist
    const createIndexRegex = /CREATE INDEX.*?;/g;
    const createIndexStatements = schema.match(createIndexRegex) || [];
    
    console.log(`\nFound ${createIndexStatements.length} CREATE INDEX statements`);
    
    for (const stmt of createIndexStatements) {
      const trimmed = stmt.trim();
      if (trimmed) {
        try {
          await connection.execute(trimmed);
          console.log(`✅ Created index: ${trimmed.substring(0, 50)}...`);
        } catch (err) {
          // Indexes might already exist, which is fine
          if (err.code === 'ER_DUP_KEYNAME') {
            console.log(`⚠️  Index already exists: ${trimmed.substring(0, 50)}...`);
          } else {
            console.log(`⚠️  Note (index): ${err.message.substring(0, 50)}...`);
          }
        }
      }
    }
    
    await connection.end();
    
    console.log(`\n📊 Restoration Summary:`);
    console.log(`   ✅ Successfully created: ${successCount} tables`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   📋 Total processed: ${createTableStatements.length} tables`);
    
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
  restoreDatabase().then(() => {
    process.exit(0);
  });
}

module.exports = restoreDatabase;