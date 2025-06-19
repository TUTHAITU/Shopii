const { Order, OrderItem, Address, Product } = require('../models');
const { sendEmail } = require('../services/emailService'); // Giả sử đường dẫn đúng
const createOrder = async (req, res) => {
  try {
    const { addressId, items } = req.body;
    const buyerId = req.user.id;

    // Kiểm tra địa chỉ giao hàng
    let selectedAddressId = addressId;
    if (!selectedAddressId) {
      // Nếu không cung cấp addressId, chọn địa chỉ mặc định
      const defaultAddress = await Address.findOne({ userId: buyerId, isDefault: true });
      if (!defaultAddress) {
        return res.status(400).json({ message: 'Vui lòng cung cấp địa chỉ giao hàng hoặc đặt một địa chỉ mặc định' });
      }
      selectedAddressId = defaultAddress._id;
    } else {
      // Kiểm tra địa chỉ có hợp lệ không
      const address = await Address.findOne({ _id: selectedAddressId, userId: buyerId });
      if (!address) {
        return res.status(404).json({ message: 'Địa chỉ không hợp lệ hoặc không thuộc về người dùng' });
      }
    }

    // Kiểm tra danh sách sản phẩm
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Danh sách sản phẩm không hợp lệ' });
    }

    // Tính tổng giá và kiểm tra sản phẩm
    let totalPrice = 0;
    const orderItems = [];
    for (const item of items) {
      const { productId, quantity } = item;
      if (!productId || !quantity || quantity < 1) {
        return res.status(400).json({ message: 'Thông tin sản phẩm không hợp lệ' });
      }

      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ message: `Sản phẩm với ID ${productId} không tồn tại` });
      }

      totalPrice += product.price * quantity;
      orderItems.push({
        productId,
        quantity,
        unitPrice: product.price,
      });
    }

    // Tạo đơn hàng mới
    const order = new Order({
      buyerId,
      addressId: selectedAddressId,
      totalPrice,
      status: 'pending',
    });

    await order.save();

    // Tạo các mục đơn hàng
    const orderItemDocs = orderItems.map(item => ({
      orderId: order._id,
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      status: 'pending',
    }));

    await OrderItem.insertMany(orderItemDocs);

    // Truy vấn Order với addressId được populate
    const orderWithAddress = await Order.findById(order._id)
      .populate('addressId', 'fullName phone street city state country')
      .lean();

    // Truy vấn OrderItem với productId được populate
    const orderItemsWithProduct = await OrderItem.find({ orderId: order._id })
      .populate('productId', 'title price')
      .lean();

    // Kết hợp kết quả
    const populatedOrder = {
      ...orderWithAddress,
      orderItems: orderItemsWithProduct,
    };

    res.status(201).json(populatedOrder);
  } catch (error) {
    console.error(error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Lỗi server' });
  }
};

const updateOrderItemStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const sellerId = req.user.id;

    // Kiểm tra xem status có được cung cấp không
    if (!status) {
      return res.status(400).json({ message: 'Vui lòng cung cấp trạng thái' });
    }

    // Kiểm tra xem status có hợp lệ không
    if (!['shipped', 'failed to ship'].includes(status)) {
      return res.status(400).json({ message: 'Trạng thái không hợp lệ. Chỉ chấp nhận "shipped" hoặc "failed to ship"' });
    }

    // Tìm OrderItem theo ID
    const orderItem = await OrderItem.findById(id);
    if (!orderItem) {
      return res.status(404).json({ message: 'Không tìm thấy mục đơn hàng' });
    }

    // Tìm sản phẩm liên quan đến OrderItem
    const product = await Product.findById(orderItem.productId);
    if (!product) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    }

    // Kiểm tra quyền của seller
    if (product.sellerId.toString() !== sellerId) {
      return res.status(403).json({ message: 'Bạn không có quyền cập nhật trạng thái cho mục đơn hàng này' });
    }

    // Cập nhật trạng thái
    orderItem.status = status;
    await orderItem.save();

    // Populate thông tin sản phẩm
    const populatedOrderItem = await OrderItem.findById(id)
      .populate('productId', 'title price')
      .lean();

    // Gửi email thông báo
    const order = await Order.findById(orderItem.orderId).populate('buyerId', 'email');
    if (order && order.buyerId && order.buyerId.email) {
      const buyerEmail = order.buyerId.email;
      const productTitle = populatedOrderItem.productId.title;
      const statusMessage = status === 'shipped' 
        ? 'đã được giao hàng thành công' 
        : 'không thể giao hàng';
      const emailSubject = 'Cập nhật trạng thái đơn hàng';
      const emailText = `Kính gửi quý khách,\n\nMục đơn hàng "${productTitle}" của bạn ${statusMessage}.\n\nCảm ơn bạn đã mua sắm với chúng tôi.`;

      sendEmail(buyerEmail, emailSubject, emailText)
        .then(() => console.log('Email sent successfully'))
        .catch((error) => console.error('Error sending email:', error));
    } else {
      console.error('Cannot find buyer email for order item', id);
    }

    res.status(200).json(populatedOrderItem);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};
module.exports = {
  createOrder,
  updateOrderItemStatus,
};