const express = require("express");
const { connect } = require("mongoose");
const router = require("./src/routers/index.js");
const dotenv = require("dotenv");
const cors = require("cors");
const http = require('http');
const socketIo = require('socket.io');
const cloudinary = require('cloudinary').v2;

require('dotenv').config();
// Load environment variables
dotenv.config();

// Verify critical environment variables
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
  console.error('Error: EMAIL_USER or EMAIL_PASS is missing in .env file');
  process.exit(1);
}
if (!process.env.MONGO_URI) {
  console.error('Error: MONGO_URI is missing in .env file');
  process.exit(1);
}

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;

connect(MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// In server.js, replace the cloudinary.config with actual credentials
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const server = http.createServer(app);

app.use("/api", router);

server.listen(PORT, () => {
  console.log(`Server is running at PORT ${PORT}`);
});