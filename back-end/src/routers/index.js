const express = require("express");
const adminRouter = require("./admin");
const sellerRouter = require("./seller");
const router = express.Router();
const authController = require("../controllers/authController");
const productController = require('../controllers/productController');
const sellerRouter1 = require("./sellerRouter");
const buyerRouter = require("./buyerRouter");

router.use("/admin", adminRouter);
router.use("/seller", sellerRouter);

// Routes cho đăng ký và đăng nhập
router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/forgot-password", authController.forgotPassword);

router.use("/buyers", buyerRouter);
router.use("/sellers", sellerRouter1);
router.get('/products', productController.listAllProducts);

module.exports = router;