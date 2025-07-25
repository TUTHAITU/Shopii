const express = require('express');
const { authMiddleware, isSeller } = require('../middleware/auth.middleware');
const couponController = require('../controllers/couponController');
const orderController = require('../controllers/orderController');

const sellerRouter = express.Router();

sellerRouter.use(authMiddleware, isSeller);

// quản lý Coupon
sellerRouter.post('/coupons', couponController.addCoupon);
sellerRouter.put('/coupons/:id', couponController.updateCoupon);
sellerRouter.delete('/coupons/:id', couponController.deleteCoupon);
sellerRouter.get('/coupons', couponController.getCouponsBySeller);

// //Cập nhật OrderItem status
// sellerRouter.put('/order-items/:id', orderController.updateOrderItemStatus);

module.exports = sellerRouter;