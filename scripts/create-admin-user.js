// scripts/create-admin-user.js
// Script to create an initial admin user with hashed password

const bcrypt = require('bcrypt');
const { pool } = require('../config/db');

async function createAdminUser() {
  try {
    // Default admin credentials
    const username = 'admin';
    const password = 'admin123'; // This will be hashed
    
    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // Insert admin user into the users table
    const [result] = await pool.execute(
      'INSERT INTO users (username, password, role) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE password = ?',
      [username, hashedPassword, 'admin', hashedPassword]
    );
    
    console.log('Admin user created/updated successfully');
    console.log('Username:', username);
    console.log('Password: admin123 (hashed in database)');
    console.log('User ID:', result.insertId);
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
}

// Run the function
createAdminUser();