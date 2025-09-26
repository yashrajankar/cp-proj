const fs = require('fs');
const mysql = require('mysql2');

// Database connection configuration
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'aicn_user',
  password: 'SecurePass123!',
  database: 'aicn_app_db'
});

// Read the schema file
const schema = fs.readFileSync('schema.sql', 'utf8');

// Split the schema into individual statements
const statements = schema.split(';').filter(stmt => stmt.trim() !== '');

// Execute each statement
connection.connect((err) => {
  if (err) {
    console.error('Error connecting to database:', err);
    return;
  }
  
  console.log('Connected to database');
  
  // Execute each statement
  statements.forEach((statement, index) => {
    const trimmedStatement = statement.trim();
    if (trimmedStatement) {
      connection.query(trimmedStatement, (err, results) => {
        if (err) {
          console.error(`Error executing statement ${index + 1}:`, err);
        } else {
          console.log(`Statement ${index + 1} executed successfully`);
        }
      });
    }
  });
  
  // Close the connection after a delay to allow all queries to complete
  setTimeout(() => {
    connection.end();
    console.log('Database initialization completed');
  }, 2000);
});