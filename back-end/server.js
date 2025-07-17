// const express = require("express");
// const dotenv = require("dotenv");
// const cors = require("cors");
// const bodyParser = require("body-parser");
// const morgan = require("morgan");

// // Import các router
// const routes = require("./routers/index.js");

// // Kết nối với MongoDB
// const ConnectDB = require("./config/db");
// const app = express();

// // app.get('/', async(req, res)=>{
// //     try {
// //         res.send({message: 'Welcome to Practical Exam!'});
// //     } catch (error) {
// //         res.send({error: error.message});
// //     }
// // });

// // Sử dụng dotenv để load các biến môi trường
// dotenv.config();

// // Middleware
// app.use(cors()); // Cho phép CORS
// app.use(bodyParser.json()); // Phân tích cú pháp JSON
// app.use(morgan("dev")); // Ghi lại các log HTTP

// // Kết nối MongoDB
// ConnectDB();

// // Sử dụng các router cho các API endpoint
// app.use("/api", routes); // Tất cả các route sẽ bắt đầu bằng /api

// const PORT = process.env.PORT || 9999;
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
const express = require("express");
const { connect } = require("mongoose");
const router = require("./routers/index.js");
const dotenv = require("dotenv");
const cors = require("cors");
const app = express();

// CORS configuration
const corsOptions = {
  origin: "http://localhost:3000", // Specify your frontend origin
  credentials: true, // Allow credentials (e.g., Authorization headers)
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // Allowed HTTP methods
  allowedHeaders: ["Content-Type", "Authorization"], // Allowed headers
};

app.use(cors(corsOptions));
app.use(express.json());

// Load environment variables
dotenv.config();
const PORT = process.env.PORT || 9999; // Default to 9999 if not set
const MONGO_URI = process.env.MONGO_URI;

// MongoDB connection with error handling
connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Use API router
app.use("/api", router);

// Start server
app.listen(PORT, () => {
  console.log(`Server is running at PORT ${PORT}`);
});
