const express = require("express");
const router = express.Router();

// Import middleware xác thực và phân quyền
const {
  authMiddleware,
  authorizeRoles,
  isAdmin,
} = require("../middleware/auth.middleware");

// Import các controller functions từ adminController
const {
  // User Management
  getAllUsers,
  getUserDetails,
  updateUserByAdmin,
  deleteUserByAdmin,

  // Store Management
  getAllStoresAdmin,
  getStoreDetails,
  updateStoreStatusByAdmin,
  updateStoreByAdmin,
  deleteStoreByAdmin,

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
} = require("../controllers/adminController");

// Áp dụng middleware xác thực và phân quyền admin cho tất cả các route trong file này
router.use(authMiddleware);
router.use(authorizeRoles("admin"));

// --- User Management Routes ---
router.get("/users", getAllUsers);
router.get("/users/:userId", getUserDetails);
router.put("/users/:userId", updateUserByAdmin);
router.delete("/users/:userId", deleteUserByAdmin); // Corrected path to /admin/users/:userId
// --- Store Management Routes ---
router.get("/stores", getAllStoresAdmin);
router.get("/stores/:storeId", getStoreDetails);
router.put("/stores/:storeId", updateStoreByAdmin);
router.put("/stores/:storeId/status", updateStoreStatusByAdmin);

// --- Category Management Routes ---
router.post("/categories", createCategoryAdmin);
router.get("/categories", getCategoriesAdmin);
router.put("/categories/:categoryId", updateCategoryAdmin);
router.delete("/categories/:categoryId", deleteCategoryAdmin);

// --- Dispute Management Routes ---
router.get("/disputes", getAllDisputesAdmin);
router.put("/disputes/:disputeId", updateDisputeByAdmin);

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

module.exports = router;
