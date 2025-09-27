// add-sample-data.js
// Script to add sample data to the database

const { pool } = require('./config/db');

async function addSampleData() {
  try {
    const connection = await pool.getConnection();
    
    console.log('Adding sample data to database...');
    
    // Add a sample staff member
    try {
      await connection.execute(
        "INSERT IGNORE INTO staff (name, department, email, phone) VALUES (?, ?, ?, ?)",
        ['John Doe', 'Computer Science', 'john.doe@example.com', '1234567890']
      );
      console.log('✅ Added sample staff member');
    } catch (err) {
      console.log('⚠️  Staff member may already exist or error:', err.message.substring(0, 50));
    }
    
    // Add a sample room
    try {
      await connection.execute(
        "INSERT IGNORE INTO rooms (number, building, capacity) VALUES (?, ?, ?)",
        ['101', 'Main Building', 50]
      );
      console.log('✅ Added sample room');
    } catch (err) {
      console.log('⚠️  Room may already exist or error:', err.message.substring(0, 50));
    }
    
    // Add a sample notification
    try {
      await connection.execute(
        "INSERT IGNORE INTO notifications (title, message, type, priority) VALUES (?, ?, ?, ?)",
        ['Welcome', 'Welcome to the system', 'info', 'medium']
      );
      console.log('✅ Added sample notification');
    } catch (err) {
      console.log('⚠️  Notification may already exist or error:', err.message.substring(0, 50));
    }
    
    // Add sample seating plan
    try {
      await connection.execute(
        "INSERT IGNORE INTO seating_plans (planData, examDate, examCode) VALUES (?, ?, ?)",
        [JSON.stringify({room101: ['A1', 'A2', 'A3']}), '2025-10-15', 'CS101']
      );
      console.log('✅ Added sample seating plan');
    } catch (err) {
      console.log('⚠️  Seating plan may already exist or error:', err.message.substring(0, 50));
    }
    
    connection.release();
    console.log('✅ Sample data addition completed');
    
  } catch (error) {
    console.error('❌ Error adding sample data:', error.message);
  }
}

addSampleData();