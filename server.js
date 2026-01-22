// Import required packages
const express = require("express");
require("dotenv").config();
const mongoose = require("mongoose");
const cors = require("cors");
const chalk = require("chalk"); // For colored console output

// Import our route files
const users = require("./routes/users");
const cards = require("./routes/cards");

// Import seed function
const seedDatabase = require("./seed");

// Create Express app
const app = express();
const port = process.env.PORT || 8000;

// Basic middleware setup
app.use(cors()); // Allow requests from other websites
app.use(express.json()); // Parse JSON data from requests
app.use(express.static('public')); // Serve files from public folder

// Error logging middleware - catches all errors (401, 403, 404, 500, etc.)
app.use((req, res, next) => {
    // Store original res.json and res.send methods
    const originalJson = res.json;
    const originalSend = res.send;
    
    // Override res.json
    res.json = function(data) {
        logError(req, res);
        return originalJson.call(this, data);
    };
    
    // Override res.send  
    res.send = function(data) {
        logError(req, res);
        return originalSend.call(this, data);
    };
    
    next();
});

// Error logging function
function logError(req, res) {
    if (res.statusCode >= 400) {
        let errorType = '';
        let color = chalk.red;
        
        switch(res.statusCode) {
            case 400: errorType = 'BAD REQUEST'; break;
            case 401: errorType = 'UNAUTHORIZED'; color = chalk.yellow; break;
            case 403: errorType = 'FORBIDDEN'; color = chalk.magenta; break;
            case 404: errorType = 'NOT FOUND'; color = chalk.red; break;
            case 500: errorType = 'SERVER ERROR'; color = chalk.red.bold; break;
            default: errorType = 'ERROR'; break;
        }
        
        console.log(color(`${errorType}: ${req.method} ${req.url} - Status: ${res.statusCode}`));
    }
}

// API Routes
app.use("/api/users", users); // All user routes
app.use("/api/cards", cards); // All card routes

// Simple 404 handler for routes that don't exist
app.use((req, res) => {
    res.status(404).json({
        error: "Page not found",
        message: `The route '${req.originalUrl}' does not exist`
    });
});

// Database connection configuration
// USE_LOCAL_DB='true' = local database, USE_LOCAL_DB='false' = cloud database
const useLocalDB = process.env.USE_LOCAL_DB === 'true';
const mongoUri = useLocalDB ? process.env.DEV : process.env.PROD;

// Connect to MongoDB
mongoose.connect(mongoUri)
  .then(async () => {
    // Success message
    console.log(chalk.green("Connected to MongoDB successfully!"));
    console.log(chalk.cyan(`Using: ${useLocalDB ? 'Development Database' : 'Production Database'}`));
    
    // Auto-seed in development only
    const isDevelopment = process.env.NODE_ENV === 'development';
    if (isDevelopment) {
      console.log(chalk.blue("Development mode - checking for test data..."));
      
      const seedResult = await seedDatabase();
      const message = seedResult.skipped ? "Test data already exists" : "Test data created successfully";
      console.log(chalk.cyan(message));
    }
  })
  .catch(err => {
    console.error(chalk.red("Database connection failed:"), err);
  });

// Start the server
app.listen(port, () => {
    console.log(chalk.blue(`Server running on port ${port}`));
    console.log(chalk.yellow(`Open http://localhost:${port} in your browser`));
});
