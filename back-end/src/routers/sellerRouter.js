const express = require('express');
const { authMiddleware1, isSeller } = require('../middleware/auth.middleware');
const couponController = require('../controllers/couponController');
const orderController = require('../controllers/orderController');

const sellerRouter1 = express.Router();

sellerRouter1.use(authMiddleware1, isSeller);

// quản lý Coupon
sellerRouter1.post('/coupons', couponController.addCoupon);
sellerRouter1.put('/coupons/:id', couponController.updateCoupon);
sellerRouter1.delete('/coupons/:id', couponController.deleteCoupon);
sellerRouter1.get('/coupons', couponController.getCouponsBySeller);

// //Cập nhật OrderItem status
// sellerRouter.put('/order-items/:id', orderController.updateOrderItemStatus);

module.exports = sellerRouter1;