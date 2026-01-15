const express = require("express");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 9000;
const mongoose = require("mongoose");

// Routes
const users = require("./routes/users");

const cors = require("cors");


// cors middleware
app.use(cors());

// Parse json bodies
app.use(express.json());

// Routes
app.use("/api/users", users);


// Connect to MongoDB
const mongoUri = process.env.DB || "mongodb://localhost:27017/business_cards";

mongoose.connect(mongoUri)
  .then(() => console.log("Connected to MongoDB"))
  .catch(err => console.error("MongoDB connection error:", err));

// Start server
app.listen(port, () => console.log("Server started on port", port));
