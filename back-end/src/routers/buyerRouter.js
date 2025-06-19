const express = require('express');
const { authMiddleware, isBuyer } = require('../middleware/auth.middleware');
const addressController = require('../controllers/addressController');
const orderController = require('../controllers/orderController');
const paymentController = require('../controllers/paymentController');
const cartController = require('../controllers/cartController');

const buyerRouter = express.Router();

buyerRouter.use(authMiddleware, isBuyer);

//Quản lý address
buyerRouter.get('/addresses', addressController.getAddressesByUser);
buyerRouter.post('/addresses', addressController.addAddress);
buyerRouter.put('/addresses/:id', addressController.updateAddress);
buyerRouter.delete('/addresses/:id', addressController.deleteAddress);
buyerRouter.put('/addresses/:id/set-default', addressController.setDefaultAddress);

//Đặt hàng
buyerRouter.post('/orders', orderController.createOrder);

//Thanh toán
buyerRouter.post('/payments', paymentController.createPayment);
buyerRouter.get('/payments/vietqr/callback', paymentController.vietQRCallback);

router.post('/add', cartController.addToCart);
router.get('/', cartController.viewCart);

module.exports = buyerRouter;