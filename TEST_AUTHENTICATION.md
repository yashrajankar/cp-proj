# Authentication Testing Guide

## How to Test the Authentication System

### 1. Access the Application
Open your browser and navigate to: http://localhost:3003

### 2. Test Admin Login
- Click on "Admin Login" tab
- Enter username: `admin`
- Enter password: `admin123`
- Click "Sign In as Admin"
- You should be redirected to the admin dashboard

### 3. Test User Login
- Click on "User Login" tab
- Enter roll number: `B1-001`
- Enter password: `2000` (odd roll numbers use 2000)
- Click "Sign In as User"
- You should be redirected to the user dashboard

### 4. Test Logout
- On either dashboard, click the "Logout" button
- You should be redirected back to the login page

### 5. Test Protected Page Access
- Try to directly access http://localhost:3003/admin.html without logging in
- You should be redirected back to the login page

## Common Test Cases

### Admin Login Test Cases
1. Valid admin credentials → Should login successfully
2. Invalid username → Should show error message
3. Invalid password → Should show error message
4. Empty fields → Should show validation error

### User Login Test Cases
1. Valid roll number with correct password → Should login successfully
2. Invalid roll number → Should show error message
3. Incorrect password → Should show error message
4. Empty fields → Should show validation error

### Password Logic
- Roll numbers ending in odd digits (1,3,5,7,9) use password `2000`
- Roll numbers ending in even digits (0,2,4,6,8) use password `2024`

## Troubleshooting

### If Login Fails
1. Check that the server is running on port 3003
2. Verify database connection is working
3. Ensure admin user exists in the database
4. Check browser console for JavaScript errors

### If Redirect Issues Occur
1. Clear browser cache and localStorage
2. Check that auth.js is properly loaded
3. Verify file paths in HTML files

## Expected Behavior

### Successful Login
- Toast notification showing "Login successful!"
- Redirect to appropriate dashboard after 1 second
- Welcome message shows user's name/username
- User info stored in localStorage

### Failed Login
- Toast notification showing error message
- Form fields remain populated
- No redirect occurs

### Logout
- localStorage cleared
- Redirect to login page
- Session terminated