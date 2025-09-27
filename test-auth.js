const http = require('http');

// Test admin login
const adminLoginData = JSON.stringify({
  username: 'admin',
  password: 'admin123'
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

const adminReq = http.request(adminLoginOptions, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Admin Login Response:');
    console.log(JSON.parse(data));
  });
});

adminReq.on('error', (error) => {
  console.error('Error:', error);
});

adminReq.write(adminLoginData);
adminReq.end();

// Test user login (even roll number should use password '2024')
const userLoginData = JSON.stringify({
  rollNo: '2024002',
  password: '2024'
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

const userReq = http.request(userLoginOptions, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('\nUser Login Response:');
    console.log(JSON.parse(data));
  });
});

userReq.on('error', (error) => {
  console.error('Error:', error);
});

userReq.write(userLoginData);
userReq.end();