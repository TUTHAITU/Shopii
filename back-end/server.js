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
const router = require("./src/routers/index.js");
const dotenv = require("dotenv");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

dotenv.config();
const PORT = process.env.PORT;
const MONGO_URI = process.env.MONGO_URI;
connect(MONGO_URI);

app.use("/api", router);

app.listen(PORT, () => {
  console.log(`server is running at PORT ${PORT}`);
});
