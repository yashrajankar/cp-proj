const http = require('http');

// Test user login with wrong credentials - should not be rate limited
const userLoginData = JSON.stringify({
  rollNo: '2021001',
  password: 'wrongpassword'
});

const userLoginOptions = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/auth/user/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(userLoginData)
  }
};

console.log('Testing user login with wrong credentials...');

const userReq = http.request(userLoginOptions, (res) => {
  console.log(`User login response status: ${res.statusCode}`);
  
  // Check if we get a 429 (rate limited) or 401 (unauthorized - expected for wrong password)
  if (res.statusCode === 429) {
    console.log('❌ Rate limiting is still active for user login');
  } else if (res.statusCode === 401) {
    console.log('✅ User login is not rate limited (got 401 Unauthorized as expected)');
  } else {
    console.log(`Response status: ${res.statusCode}`);
  }
  
  res.on('data', (chunk) => {
    console.log(`Response body: ${chunk}`);
  });
});

userReq.on('error', (error) => {
  console.error(`User login error: ${error.message}`);
});

userReq.write(userLoginData);
userReq.end();

// Test admin login with wrong credentials - should not be rate limited
const adminLoginData = JSON.stringify({
  username: 'admin',
  password: 'wrongpassword'
});

const adminLoginOptions = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/auth/admin/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(adminLoginData)
  }
};

console.log('\nTesting admin login with wrong credentials...');

const adminReq = http.request(adminLoginOptions, (res) => {
  console.log(`Admin login response status: ${res.statusCode}`);
  
  // Check if we get a 429 (rate limited) or 401 (unauthorized - expected for wrong password)
  if (res.statusCode === 429) {
    console.log('❌ Rate limiting is still active for admin login');
  } else if (res.statusCode === 401) {
    console.log('✅ Admin login is not rate limited (got 401 Unauthorized as expected)');
  } else {
    console.log(`Response status: ${res.statusCode}`);
  }
  
  res.on('data', (chunk) => {
    console.log(`Response body: ${chunk}`);
  });
});

adminReq.on('error', (error) => {
  console.error(`Admin login error: ${error.message}`);
});

adminReq.write(adminLoginData);
adminReq.end();