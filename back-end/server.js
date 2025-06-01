const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const bodyParser = require('body-parser');
const morgan = require('morgan');

// Import các router
const routes = require('./src/routers');

// Kết nối với MongoDB
const ConnectDB = require('./config/db');
const app = express();

// app.get('/', async(req, res)=>{
//     try {
//         res.send({message: 'Welcome to Practical Exam!'});
//     } catch (error) {
//         res.send({error: error.message});
//     }
// });


// Sử dụng dotenv để load các biến môi trường
dotenv.config();

// Middleware
app.use(cors()); // Cho phép CORS
app.use(bodyParser.json()); // Phân tích cú pháp JSON
app.use(morgan('dev')); // Ghi lại các log HTTP

// Kết nối MongoDB
ConnectDB();

// Sử dụng các router cho các API endpoint
app.use('/api', routes);  // Tất cả các route sẽ bắt đầu bằng /api


const PORT = process.env.PORT || 9999;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));