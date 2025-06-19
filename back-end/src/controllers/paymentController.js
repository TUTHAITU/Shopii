// paymentController.js
const axios = require('axios');
const { Payment, Order } = require('../models');

/**
 * Tạo yêu cầu thanh toán mới
 */
const createPayment = async (req, res) => {
  try {
    const { orderId, method } = req.body;
    const userId = req.user.id;

    // Kiểm tra phương thức thanh toán hợp lệ
    if (!['COD', 'VietQR', 'E-Wallet'].includes(method)) {
      return res.status(400).json({ message: 'Phương thức thanh toán không hợp lệ.' });
    }

    // Tìm đơn hàng
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    }
    if (order.buyerId.toString() !== userId) {
      return res.status(403).json({ message: 'Bạn không có quyền thanh toán cho đơn hàng này' });
    }
    if (order.status !== 'pending') {
      return res.status(400).json({ message: 'Đơn hàng không ở trạng thái có thể thanh toán' });
    }

    // Kiểm tra xem đã có payment chưa
    const existingPayment = await Payment.findOne({ orderId });
    if (existingPayment) {
      return res.status(400).json({ message: 'Đơn hàng này đã có bản ghi thanh toán' });
    }

    // Tạo payment mới
    const payment = new Payment({
      orderId,
      userId,
      amount: order.totalPrice,
      method,
      status: 'pending',
    });

    if (method === 'COD') {
      await payment.save();
      return res.status(201).json({
        message: 'Đã tạo yêu cầu thanh toán COD thành công',
        payment,
      });
    } else if (method === 'VietQR') {
      await payment.save();

      try {
        const vietQR_API_URL = 'https://api.vietqr.io/v2/generate';
        const LOCALTUNNEL_URL = 'https://thangnd.loca.lt'; // Thay bằng URL thực tế
        const callbackUrl = `${LOCALTUNNEL_URL}/api/payments/vietqr/callback`;

        const response = await axios.post(vietQR_API_URL, {
          accountNo: process.env.BANK_ACCOUNT_NO,
          accountName: process.env.BANK_ACCOUNT_NAME,
          acqId: parseInt(process.env.BANK_ACQ_ID),
          amount: order.totalPrice,
          addInfo: orderId,
          format: 'text',
          template: 'compact',
          callbackUrl, // Đăng ký callback URL
        }, {
          headers: {
            'x-client-id': process.env.VIETQR_CLIENT_ID,
            'x-api-key': process.env.VIETQR_API_KEY,
            'Content-Type': 'application/json'
          }
        });

        const responseData = response.data;

        if (responseData.code !== '00') {
          console.error('Lỗi khi tạo mã QR từ VietQR API:', responseData.desc);
          payment.status = 'failed';
          await payment.save();
          return res.status(500).json({ message: 'Không thể tạo mã thanh toán QR.', details: responseData.desc });
        }

        return res.status(201).json({
          message: 'Đã tạo yêu cầu thanh toán VietQR thành công',
          payment,
          qrData: responseData.data
        });
      } catch (apiError) {
        console.error('Lỗi gọi API VietQR:', apiError.response ? apiError.response.data : apiError.message);
        payment.status = 'failed';
        await payment.save();
        return res.status(502).json({ message: 'Lỗi giao tiếp với cổng thanh toán.' });
      }
    } else if (method === 'E-Wallet') {
      // Xử lý E-Wallet (Momo, etc.) trong tương lai
      return res.status(501).json({ message: 'Phương thức thanh toán E-Wallet chưa được triển khai.' });
    }
  } catch (error) {
    console.error('Lỗi tạo thanh toán:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    return res.status(500).json({ message: 'Lỗi server' });
  }
};

/**
 * Nhận callback từ VietQR và cập nhật trạng thái thanh toán
 */
const vietQRCallback = async (req, res) => {
  try {
    const { orderId, status, transactionId } = req.body;

    // Tìm payment theo orderId
    const payment = await Payment.findOne({ orderId });
    if (!payment) {
      console.error('Không tìm thấy thanh toán cho orderId:', orderId);
      return res.status(404).json({ message: 'Không tìm thấy thanh toán' });
    }

    // Cập nhật trạng thái thanh toán
    if (status === 'SUCCESS') {
      payment.status = 'paid';
      payment.paidAt = new Date();
      payment.transactionId = transactionId;
    } else {
      payment.status = 'failed';
    }

    await payment.save();

    // Cập nhật trạng thái đơn hàng nếu cần
    const order = await Order.findById(orderId);
    if (order && payment.status === 'paid') {
      order.status = 'paid';
      await order.save();
    }

    console.log(`Cập nhật trạng thái thanh toán thành công cho orderId: ${orderId}, status: ${payment.status}`);
    return res.status(200).json({ message: 'Cập nhật trạng thái thanh toán thành công' });
  } catch (error) {
    console.error('Lỗi xử lý callback VietQR:', error);
    return res.status(500).json({ message: 'Lỗi server khi xử lý callback' });
  }
};

module.exports = {
  createPayment,
  vietQRCallback,
};