// routers/admin.js

const express = require("express");
const router = express.Router();

// Import middleware xác thực và phân quyền
const {
  authMiddleware1,
  authorizeRoles,
  isAdmin,
} = require("../middleware/auth.middleware"); // Điều chỉnh đường dẫn nếu cần

// Import các controller functions từ adminController
const {
  // User Management
  getAllUsers,
  getUserDetails,
  updateUserByAdmin,
  deleteUserByAdmin,

  // Store Management
  getAllStoresAdmin,
  updateStoreStatusByAdmin,

  // Category Management
  createCategoryAdmin,
  getCategoriesAdmin,
  updateCategoryAdmin,
  deleteCategoryAdmin,

  // Dispute Management
  getAllDisputesAdmin,
  updateDisputeByAdmin,

  // Coupon Management
  createCouponAdmin,
  getAllCouponsAdmin,
  updateCouponAdmin,
  deleteCouponAdmin,

  // Product Management by Admin
  getAllProductsAdmin,
  deleteProductByAdmin,

  // Order Management by Admin
  getAllOrdersAdmin,
  getOrderDetailsAdmin,
  updateOrderStatusAdmin,

  // Review and Feedback Moderation
  getAllReviewsAdmin,
  deleteReviewByAdmin,
  getAllSellerFeedbackAdmin,

  // Admin Dashboard
  getAdminDashboardStats,
} = require("../controllers/adminController"); // Điều chỉnh đường dẫn nếu cần

const {
  createVoucher,
  getVouchers,
  getVoucherById,
  updateVoucher,
  deleteVoucher,
  toggleVoucherActive,
} = require('../controllers/voucherController');

// Áp dụng middleware xác thực và phân quyền admin cho tất cả các route trong file này
router.use(authMiddleware1);
router.use(authorizeRoles("admin")); // Hoặc router.use(isAdmin);

// --- User Management Routes ---
router.get("/users", getAllUsers);
router.get("/users/:userId", getUserDetails);
router.put("/users/:userId", updateUserByAdmin);
router.delete("/users/:userId", deleteUserByAdmin);

// --- Store Management Routes ---
router.get("/stores", getAllStoresAdmin); // Ví dụ: GET /api/admin/stores?status=pending
router.put("/stores/:storeId/status", updateStoreStatusByAdmin);

// --- Category Management Routes ---
router.post("/categories", createCategoryAdmin);
router.get("/categories", getCategoriesAdmin);
router.put("/categories/:categoryId", updateCategoryAdmin);
router.delete("/categories/:categoryId", deleteCategoryAdmin);

// --- Dispute Management Routes ---
router.get("/disputes", getAllDisputesAdmin);
router.put("/disputes/:disputeId", updateDisputeByAdmin);

// --- Coupon Management Routes ---
router.post("/coupons", createCouponAdmin);
router.get("/coupons", getAllCouponsAdmin);
router.put("/coupons/:couponId", updateCouponAdmin);
router.delete("/coupons/:couponId", deleteCouponAdmin);

// --- Product Management by Admin Routes ---
router.get("/products", getAllProductsAdmin);
router.delete("/products/:productId", deleteProductByAdmin);

// --- Order Management by Admin Routes ---
router.get("/orders", getAllOrdersAdmin);
router.get("/orders/:orderId", getOrderDetailsAdmin);
router.put("/orders/:orderId/status", updateOrderStatusAdmin);

// --- Review and Feedback Moderation Routes ---
router.get("/reviews", getAllReviewsAdmin);
router.delete("/reviews/:reviewId", deleteReviewByAdmin);
router.get("/seller-feedback", getAllSellerFeedbackAdmin);

// --- Admin Dashboard Routes ---
router.get("/dashboard/stats", getAdminDashboardStats);

// Voucher Management Routes
router.post('/vouchers', createVoucher);
router.get('/vouchers', getVouchers);
router.get('/vouchers/:id', getVoucherById);
router.put('/vouchers/:id', updateVoucher);
router.delete('/vouchers/:id', deleteVoucher);
router.put('/vouchers/:id/toggle-active', toggleVoucherActive);

module.exports = router;
