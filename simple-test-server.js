const express = require('express');
const app = express();
const port = 8000;

// Simple test route
app.get('/simple-test', (req, res) => {
    console.log('Simple test route called');
    res.json({ message: 'Server is working!', timestamp: new Date() });
});

app.listen(port, '127.0.0.1', () => {
    console.log(`✅ Simple server running on http://127.0.0.1:${port}`);
    console.log('Try: http://127.0.0.1:8000/simple-test');
});