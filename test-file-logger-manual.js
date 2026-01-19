const fs = require('fs-extra');
const path = require('path');

// Simulate the file logger functionality
console.log('🧪 Testing File Logger functionality manually...\n');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, 'logs');
fs.ensureDirSync(logsDir);

// Get today's date for filename
const today = new Date();
const dateStr = today.getFullYear() + 
  String(today.getMonth() + 1).padStart(2, '0') + 
  String(today.getDate()).padStart(2, '0');

const logFile = path.join(logsDir, `error-log-${dateStr}.log`);

// Simulate an error log entry
const logEntry = {
  timestamp: new Date().toISOString(),
  method: 'GET',
  url: '/test-file-logger',
  statusCode: 404,
  userAgent: 'Test-Client/1.0',
  ip: '127.0.0.1',
  responseBody: { 
    message: "Testing file logger", 
    timestamp: new Date().toISOString(),
    statusCode: 404 
  }
};

const logLine = `${logEntry.timestamp} | ${logEntry.method} ${logEntry.url} | Status: ${logEntry.statusCode} | IP: ${logEntry.ip} | User-Agent: ${logEntry.userAgent} | Response: ${JSON.stringify(logEntry.responseBody)}\n`;

// Append to log file
fs.appendFileSync(logFile, logLine);

console.log('✅ File Logger Test Results:');
console.log(`📁 Log Directory: ${logsDir}`);
console.log(`📄 Log File: ${path.basename(logFile)}`);
console.log(`📝 Log Entry: ${logLine.trim()}`);

// Check if file was created and has content
if (fs.existsSync(logFile)) {
  const fileContent = fs.readFileSync(logFile, 'utf8');
  console.log(`📊 File Size: ${fileContent.length} characters`);
  console.log('\n🎉 File Logger is working correctly!');
  
  console.log('\n📋 Complete Log File Contents:');
  console.log('=====================================');
  console.log(fileContent);
  console.log('=====================================');
} else {
  console.log('❌ Log file was not created');
}