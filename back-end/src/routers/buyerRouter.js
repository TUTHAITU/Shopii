const express = require('express');
const { authMiddleware, isBuyer, isSellerOrBuyer } = require('../middleware/auth.middleware');
const orderController = require('../controllers/orderController');
const cartController = require('../controllers/cartController'); // Thêm dòng này
const addressController = require('../controllers/addressController');
const { getVoucherByCode } = require('../controllers/voucherController');
const paymentController = require('../controllers/paymentController');
const authController = require('../controllers/authController');

const buyerRouter = express.Router();

// Public routes for payment callbacks (không yêu cầu xác thực)
buyerRouter.post('/payments/vietqr/callback', paymentController.vietQRCallback);
buyerRouter.get('/payments/payos/callback', paymentController.payosCallback);
buyerRouter.get('/payments/payos/cancel', paymentController.payosCallback); // Using the same handler for cancel, as it handles failure cases

// Protected routes (yêu cầu xác thực là buyer)
buyerRouter.use(authMiddleware); // Add this line to ensure authentication happens first
buyerRouter.use(isSellerOrBuyer);

// User role management
buyerRouter.put('/change-role', authController.changeRole);

// Quản lý giỏ hàng
buyerRouter.post('/cart/add', cartController.addToCart);
buyerRouter.get('/cart', cartController.viewCart);
buyerRouter.put('/cart/update/:productId', cartController.updateCartItem);
buyerRouter.delete('/cart/remove/:productId', cartController.deleteCartItem);

// Address routes
buyerRouter.post('/addresses', addressController.createAddress);
buyerRouter.get('/addresses', addressController.getAddresses);
buyerRouter.put('/addresses/:id', addressController.updateAddress);
buyerRouter.delete('/addresses/:id', addressController.deleteAddress);
buyerRouter.put('/addresses/:id/default', addressController.setDefaultAddress);

buyerRouter.get('/vouchers/code/:code', getVoucherByCode);

// Quản lý đơn hàng
buyerRouter.post('/orders', orderController.createOrder);

// Quản lý thanh toán
buyerRouter.post('/payments', paymentController.createPayment);
buyerRouter.get('/payments/status/:orderId', paymentController.checkPaymentStatus);

module.exports = buyerRouter;