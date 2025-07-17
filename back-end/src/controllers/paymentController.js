// paymentController.js
const axios = require('axios');
const crypto = require('crypto'); // Thêm để tính signature
const { Payment, Order } = require('../models');

/**
 * Tạo yêu cầu thanh toán mới
 */
const createPayment = async (req, res) => {
  try {
    const { orderId, method } = req.body;
    const userId = req.user.id;

    // Kiểm tra phương thức thanh toán hợp lệ
    if (!['COD', 'VietQR', 'PayOS'].includes(method)) {
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
        // Check required environment variables
        if (!process.env.BANK_ACCOUNT_NO || !process.env.BANK_ACCOUNT_NAME || 
            !process.env.BANK_ACQ_ID || !process.env.VIETQR_CLIENT_ID || 
            !process.env.VIETQR_API_KEY) {
          console.error('Thiếu cấu hình VietQR. Vui lòng kiểm tra các biến môi trường BANK_* và VIETQR_*');
          payment.status = 'failed';
          await payment.save();
          return res.status(500).json({ message: 'Lỗi cấu hình cổng thanh toán VietQR.' });
        }

        const vietQR_API_URL = 'https://api.vietqr.io/v2/generate';
        const NGROK_URL = 'https://34e6f6632c0e.ngrok-free.app'; // Thay bằng URL ngrok thực tế của bạn
        const callbackUrl = `${NGROK_URL}/api/payments/vietqr/callback`;

        // Chuyển đổi giá trị sang số nguyên VND (không có dấu thập phân)
        const amountInVnd = Math.round(order.totalPrice);
        
        // Log giá trị gửi đi
        console.log('Sending to VietQR API - Amount:', amountInVnd, 'Original:', order.totalPrice);

        const response = await axios.post(vietQR_API_URL, {
          accountNo: process.env.BANK_ACCOUNT_NO,
          accountName: process.env.BANK_ACCOUNT_NAME,
          acqId: parseInt(process.env.BANK_ACQ_ID),
          amount: amountInVnd,
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
        console.log('VietQR API response:', JSON.stringify(responseData, null, 2));

        if (responseData.code !== '00') {
          console.error('Lỗi khi tạo mã QR từ VietQR API:', responseData.desc);
          payment.status = 'failed';
          await payment.save();
          return res.status(500).json({ message: 'Không thể tạo mã thanh toán QR.', details: responseData.desc });
        }

        // Validate the QR data contains the necessary information
        if (!responseData.data || !responseData.data.qrDataURL) {
          console.error('VietQR API response missing QR data:', responseData);
          payment.status = 'failed';
          await payment.save();
          return res.status(500).json({ message: 'Dữ liệu QR không hợp lệ từ VietQR API.' });
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
        return res.status(502).json({ message: 'Lỗi giao tiếp với cổng thanh toán VietQR.' });
      }
    } else if (method === 'PayOS') {
      await payment.save();

      try {
        // Kiểm tra các environment variables cần thiết cho PayOS
        if (!process.env.PAYOS_CLIENT_ID || !process.env.PAYOS_API_KEY || !process.env.PAYOS_CHECKSUM_KEY) {
          console.error('Thiếu cấu hình PayOS. Vui lòng kiểm tra các biến môi trường PAYOS_CLIENT_ID, PAYOS_API_KEY, PAYOS_CHECKSUM_KEY');
          payment.status = 'failed';
          await payment.save();
          return res.status(500).json({ message: 'Lỗi cấu hình cổng thanh toán PayOS.' });
        }

        const PAYOS_API_URL = 'https://api-merchant.payos.vn/v2/payment-requests'; // URL API chính thức của PayOS
        const NGROK_URL = 'https://34e6f6632c0e.ngrok-free.app'; // Thay bằng URL ngrok thực tế của bạn
        const returnUrl = `${NGROK_URL}/api/payments/payos/callback`;
        const cancelUrl = `${NGROK_URL}/api/payments/payos/cancel`;

        // Tạo orderCode là số nguyên dương
        const numericOrderCode = Date.now(); // Sử dụng timestamp là số nguyên dương
        
        // Giới hạn description tối đa 25 ký tự
        const shortDescription = `Thanh toán #${numericOrderCode % 10000}`; // Rút gọn mô tả
        
        // Chuyển đổi giá trị sang số nguyên VND (không có dấu thập phân)
        const amountInVnd = Math.round(order.totalPrice);
        console.log('Sending to PayOS API - Amount:', amountInVnd, 'Original:', order.totalPrice);
        
        // Tính signature theo tài liệu PayOS với dữ liệu mới
        const rawSignature = `amount=${amountInVnd}&cancelUrl=${cancelUrl}&description=${shortDescription}&orderCode=${numericOrderCode}&returnUrl=${returnUrl}`;
        const signature = crypto.createHmac('sha256', process.env.PAYOS_CHECKSUM_KEY)
          .update(rawSignature)
          .digest('hex');

        const paymentData = {
          orderCode: numericOrderCode, // Sử dụng mã số thay vì chuỗi
          amount: amountInVnd,
          description: shortDescription, // Sử dụng mô tả đã rút gọn
          returnUrl,
          cancelUrl,
          signature,
        };

        // Lưu orderCode vào payment để có thể tra cứu sau này
        payment.transactionId = numericOrderCode.toString();
        await payment.save();

        const response = await axios.post(PAYOS_API_URL, paymentData, {
          headers: {
            'x-client-id': process.env.PAYOS_CLIENT_ID,
            'x-api-key': process.env.PAYOS_API_KEY,
            'Content-Type': 'application/json',
          },
        });

        const responseData = response.data;
        console.log('PayOS API response:', JSON.stringify(responseData, null, 2));

        if (responseData.code !== '00') {
          console.error('Lỗi khi tạo thanh toán PayOS:', responseData.desc);
          payment.status = 'failed';
          await payment.save();
          return res.status(500).json({ message: 'Không thể tạo thanh toán PayOS.', details: responseData.desc });
        }

        // Validate that checkoutUrl is present
        if (!responseData.data || !responseData.data.checkoutUrl) {
          console.error('PayOS API response missing checkout URL:', responseData);
          payment.status = 'failed';
          await payment.save();
          return res.status(500).json({ message: 'Dữ liệu không hợp lệ từ PayOS API.' });
        }

        return res.status(201).json({
          message: 'Đã tạo yêu cầu thanh toán PayOS thành công',
          payment,
          paymentUrl: responseData.data.checkoutUrl // Trả về URL thanh toán PayOS
        });
      } catch (apiError) {
        console.error('Lỗi gọi API PayOS:', apiError.response ? apiError.response.data : apiError.message);
        payment.status = 'failed';
        await payment.save();
        return res.status(502).json({ message: 'Lỗi giao tiếp với cổng thanh toán PayOS.' });
      }
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

    // Nếu payment status là paid, cập nhật các OrderItems liên quan sang shipping
    if (payment.status === 'paid') {
      try {
        // Tìm các OrderItems thuộc về đơn hàng và đang ở trạng thái pending
        const orderItems = await OrderItem.find({ 
          orderId: payment.orderId,
          status: "pending"
        });
        
        // Cập nhật các OrderItems sang trạng thái shipping
        for (const item of orderItems) {
          item.status = "shipping";
          await item.save();
        }
        
        console.log(`Updated ${orderItems.length} order items to shipping status for orderId: ${orderId}`);
      } catch (orderError) {
        console.error('Error updating order items:', orderError);
      }
    }

    console.log(`Cập nhật trạng thái thanh toán thành công cho orderId: ${orderId}, status: ${payment.status}`);
    return res.status(200).json({ 
      success: true,
      message: 'Cập nhật trạng thái thanh toán thành công',
      paymentStatus: payment.status
    });
  } catch (error) {
    console.error('Lỗi xử lý callback VietQR:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Lỗi server khi xử lý callback' 
    });
  }
};

/**
 * Nhận callback từ PayOS và cập nhật trạng thái thanh toán
 */
const payosCallback = async (req, res) => {
  try {
    console.log('PayOS callback received with params:', req.query);
    const { orderCode, status } = req.query; // PayOS thường gửi dữ liệu qua query params

    if (!orderCode) {
      console.error('Missing orderCode in PayOS callback');
      return res.status(400).json({ message: 'Missing orderCode parameter' });
    }

    console.log('Looking for payment with transactionId:', orderCode);
    
    // Tìm payment theo transactionId (orderCode)
    let payment = await Payment.findOne({ transactionId: orderCode.toString() });
    
    // Nếu không tìm thấy bằng transactionId, thử tìm bằng orderId
    if (!payment) {
      console.log('Payment not found by transactionId, trying with orderId');
      payment = await Payment.findOne({ orderId: orderCode });
    }
    
    if (!payment) {
      console.error('Không tìm thấy thanh toán cho orderCode:', orderCode);
      return res.status(404).json({ message: 'Không tìm thấy thanh toán' });
    }

    console.log('Payment found:', payment._id);

    // Cập nhật trạng thái thanh toán
    if (status === 'PAID') {
      payment.status = 'paid';
      payment.paidAt = new Date();
      console.log('Payment status updated to paid');
    } else {
      payment.status = 'failed';
      console.log('Payment status updated to failed');
    }

    await payment.save();
    console.log('Payment saved successfully');

    // Nếu payment status là paid, cập nhật các OrderItems liên quan sang shipping
    if (payment.status === 'paid') {
      try {
        // Tìm các OrderItems thuộc về đơn hàng và đang ở trạng thái pending
        const orderItems = await OrderItem.find({ 
          orderId: payment.orderId,
          status: "pending"
        });
        
        // Cập nhật các OrderItems sang trạng thái shipping
        for (const item of orderItems) {
          item.status = "shipping";
          await item.save();
        }
        
        console.log(`Updated ${orderItems.length} order items to shipping status`);
      } catch (orderError) {
        console.error('Error updating order items:', orderError);
      }
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Payment status updated successfully',
      status: payment.status
    });
  } catch (error) {
    console.error('Error in PayOS callback:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Kiểm tra trạng thái thanh toán của đơn hàng
 */
const checkPaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;

    // Tìm thanh toán theo orderId
    const payment = await Payment.findOne({ orderId });
    if (!payment) {
      return res.status(404).json({ message: 'Không tìm thấy thông tin thanh toán' });
    }

    // Kiểm tra quyền truy cập
    if (payment.userId.toString() !== userId) {
      return res.status(403).json({ message: 'Bạn không có quyền xem thông tin thanh toán này' });
    }

    // Tìm đơn hàng để lấy thêm thông tin
    const order = await Order.findById(orderId);

    return res.status(200).json({
      payment: {
        id: payment._id,
        method: payment.method,
        amount: payment.amount,
        status: payment.status,
        paidAt: payment.paidAt,
        transactionId: payment.transactionId
      },
      order: order ? {
        id: order._id,
        status: order.status
      } : null
    });
  } catch (error) {
    console.error('Lỗi khi kiểm tra trạng thái thanh toán:', error);
    return res.status(500).json({ message: 'Lỗi server' });
  }
};

module.exports = {
  createPayment,
  vietQRCallback,
  payosCallback,
  checkPaymentStatus
};