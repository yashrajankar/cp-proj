# MySQL Connection Summary for AICN Examination Management System

## Overview
The AICN Examination Management System is fully connected to a MySQL database. The connection flow from index.html to MySQL works as follows:

## Connection Flow

### 1. Frontend (index.html)
- User enters credentials in the login form
- JavaScript in auth.js captures the form data
- Makes HTTP POST requests to authentication endpoints:
  - Admin login: `/api/auth/admin/login`
  - User login: `/api/auth/user/login`

### 2. Backend (server.js)
- Express.js server receives the authentication requests
- Routes the requests to appropriate authentication handlers
- Queries the MySQL database using prepared statements
- Returns JSON responses with authentication results

### 3. Database (MySQL)
- Database connection managed by `config/db.js`
- Uses connection pooling for efficient resource management
- Queries the `users` table for admin authentication
- Queries the `students` table for user authentication

## Database Schema

### Key Tables
1. **users** - Stores admin user credentials
   - id (INT, PRIMARY KEY)
   - username (VARCHAR)
   - password (VARCHAR, hashed)
   - role (VARCHAR, 'admin')

2. **students** - Stores student information
   - id (INT, PRIMARY KEY)
   - rollNo (VARCHAR, UNIQUE)
   - name (VARCHAR)
   - section (VARCHAR)
   - email (VARCHAR)
   - phone (VARCHAR)

## Authentication Logic

### Admin Authentication
- Username/password based
- Passwords stored as bcrypt hashes
- Verified against `users` table where role = 'admin'

### User Authentication
- Roll number/password based
- Password logic: Even roll numbers use '2024', odd use '2000'
- Verified against `students` table

## Configuration

### Database Connection
- **Host**: localhost
- **Port**: 3306
- **Database**: aicn_app_db
- **Username**: aicn_user
- **Password**: SecurePass123!

### Environment Variables (.env file)
```
DB_HOST=localhost
DB_PORT=3306
DB_USER=aicn_user
DB_PASSWORD=SecurePass123!
DB_NAME=aicn_app_db
```

## Testing Results
✅ Database connection successful
✅ Users table accessible with 1 admin record
✅ Students table accessible with 207 student records
✅ Admin user exists (username: 'admin', role: 'admin')
✅ Sample student data available

## How to Test the Connection

1. Run the database connection test:
   ```bash
   node test-db-connection.js
   ```

2. Run the authentication endpoints test:
   ```bash
   node test-auth-endpoints.js
   ```

3. Start the server and test login through the web interface:
   ```bash
   npm start
   ```

## Troubleshooting

### Common Issues
1. **Connection Refused** - Ensure MySQL server is running
2. **Access Denied** - Verify database credentials in .env file
3. **Database Not Found** - Run the schema.sql script to create database and tables
4. **Admin User Missing** - Run scripts/create-admin-user.js to create admin user

### Verification Commands
```sql
-- Check if database exists
SHOW DATABASES LIKE 'aicn_app_db';

-- Check if users table has data
SELECT * FROM users;

-- Check if students table has data
SELECT COUNT(*) FROM students;
```

The system is properly connected and ready for use.