const http = require('http');

// Test admin login
console.log('Testing admin login...');
const adminData = JSON.stringify({
  username: 'admin',
  password: 'admin123'
});

const adminOptions = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/auth/admin/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(adminData)
  }
};

const adminReq = http.request(adminOptions, (res) => {
  let responseData = '';
  
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  
  res.on('end', () => {
    console.log('Admin Login - Status Code:', res.statusCode);
    console.log('Admin Login - Response:', responseData);
    
    // Test user login after admin login is complete
    testUserLogin();
  });
});

adminReq.on('error', (error) => {
  console.error('Admin Login Error:', error.message);
});

adminReq.write(adminData);
adminReq.end();

// Test user login
function testUserLogin() {
  console.log('\nTesting user login...');
  const userData = JSON.stringify({
    rollNo: '2024002',
    password: '2024'
  });

  const userOptions = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/auth/user/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(userData)
    }
  };

  const userReq = http.request(userOptions, (res) => {
    let responseData = '';
    
    res.on('data', (chunk) => {
      responseData += chunk;
    });
    
    res.on('end', () => {
      console.log('User Login - Status Code:', res.statusCode);
      console.log('User Login - Response:', responseData);
    });
  });

  userReq.on('error', (error) => {
    console.error('User Login Error:', error.message);
  });

  userReq.write(userData);
  userReq.end();
}