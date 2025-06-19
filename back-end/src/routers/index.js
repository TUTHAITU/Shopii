const express = require("express");
const sellerRouter = require("./sellerRouter");
const buyerRouter = require('./buyerRouter');
const router = express.Router();
const multer = require('multer');

router.use("/sellers", sellerRouter);
router.use('/buyers', buyerRouter);

// Định nghĩa route cho tìm kiếm bằng hình ảnh

module.exports = router;