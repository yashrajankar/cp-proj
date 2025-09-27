// add-sample-student.js
// Script to add a sample student to the database for testing

const { pool } = require('./config/db');

async function addSampleStudent() {
  try {
    const connection = await pool.getConnection();
    
    console.log('Adding sample student to database...');
    
    // Add a sample student
    try {
      await connection.execute(
        "INSERT IGNORE INTO students (rollNo, name, section, email, phone) VALUES (?, ?, ?, ?, ?)",
        ['B1-001', 'Jane Smith', 'B1', 'jane.smith@example.com', '0987654321']
      );
      console.log('✅ Added sample student');
    } catch (err) {
      console.log('⚠️  Student may already exist or error:', err.message.substring(0, 50));
    }
    
    connection.release();
    console.log('✅ Sample student addition completed');
    
  } catch (error) {
    console.error('❌ Error adding sample student:', error.message);
  }
}

addSampleStudent();