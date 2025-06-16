const express = require("express");
const router = express.Router();
const sellerController = require("../controllers/sellerController");
const { authMiddleware, isSeller, authorizeRoles} = require("../middleware/auth.middleware");

// Middleware xác thực và kiểm tra vai trò seller
router.use(authMiddleware);
// router.use(authorizeRoles("seller")); 
router.use(isSeller);

// Đăng nhập và chuyển chế độ
router.post("/login", sellerController.loginAndSwitch);

// Quản lý cửa hàng
router.get("/store", sellerController.getProfileStore); // LẤY PROFILE STORE
router.put("/store", sellerController.updateStoreProfile); // UPDATE

// Quản lý sản phẩm
router.post("/products", sellerController.createProduct);
router.get("/products", sellerController.getProducts);
router.put("/products/:id", sellerController.updateProduct);
router.delete("/products/:id", sellerController.deleteProduct);
router.get('/categories', sellerController.getAllCategories);
router.post('/categories', sellerController.addNewCategory);

// Quản lý tồn kho
router.get("/inventory", sellerController.getInventory);
router.put("/inventory/:productId", sellerController.updateInventory);

// Lấy chi tiết 1 sản phẩm
router.get("/products/:id", sellerController.getProductById);
// Lấy review theo productId
router.get("/products/:id/reviews", sellerController.getReviewsByProductId);







// Quản lý đơn hàng
router.post("/orders/:orderId/confirm", sellerController.confirmOrder);

// Đánh giá và phản hồi
router.get("/reviews", sellerController.getProductReviews);
router.post("/feedback", sellerController.submitFeedback);

// Báo cáo
router.get("/report", sellerController.getSalesReport);

// Khiếu nại
router.get("/disputes", sellerController.getDisputes);
router.put("/disputes/:id/resolve", sellerController.resolveDispute);

module.exports = router;