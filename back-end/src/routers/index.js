const express = require("express");
const adminRouter = require("./admin");
const sellerRouter = require("./seller");
const router = express.Router();
const authController = require("../controllers/authController");
const productController = require('../controllers/productController');
const buyerRouter = require("./buyerRouter");
const { authMiddleware } = require("../middleware/auth.middleware");

router.use("/admin", adminRouter);
router.use("/seller", sellerRouter);

// Routes cho đăng ký và đăng nhập
router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/forgot-password", authController.forgotPassword);

// User profile routes
router.get("/profile", authMiddleware, authController.getProfile);
router.put("/profile", authMiddleware, authController.updateProfile);
router.put("/profile/password", authMiddleware, authController.updatePassword);

router.use("/buyers", buyerRouter);
router.get('/products', productController.listAllProducts);

module.exports = router;