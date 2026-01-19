const http = require('http');

console.log('Starting test...');

// Make a request to simple test server first
const options = {
  hostname: '127.0.0.1',
  port: 8000,
  path: '/simple-test',
  method: 'GET'
};

console.log('Making request to http://127.0.0.1:8000/simple-test');

const req = http.request(options, (res) => {
  console.log(`Status Code: ${res.statusCode}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      console.log('Response:', JSON.parse(data));
    } catch (e) {
      console.log('Raw response:', data);
    }
    console.log('✅ Simple test completed successfully!');
  });
});

req.on('error', (error) => {
  console.error('❌ Error:', error.message);
});

req.setTimeout(5000, () => {
  req.destroy();
  console.error('❌ Request timeout');
});

req.end();

console.log('Request sent!');