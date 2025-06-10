const User = require("../models/User");
const Store = require("../models/Store");
const Product = require("../models/Product");
const Inventory = require("../models/Inventory");
const Order = require("../models/Order");
const OrderItem = require("../models/OrderItem");
const ShippingInfo = require("../models/ShippingInfo");
const Review = require("../models/Review");
const Feedback = require("../models/Feedback");
const Dispute = require("../models/Dispute");
const bcrypt = require("bcryptjs");
const jwt = require('jsonwebtoken');

// Đăng nhập và chuyển sang chế độ bán hàng
exports.loginAndSwitch = async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }
    
    // Kiểm tra role
    if (user.role !== "seller") {
      return res.status(403).json({ success: false, message: "User is not a seller" });
    }
    
    res.json({ 
      success: true,
      message: "Logged in as seller",
      user: {
        id: user._id,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Cập nhật hồ sơ cửa hàng
exports.updateStoreProfile = async (req, res) => {
  try {
    const { storeName, description, bannerImageURL } = req.body;
    const sellerId = req.user.id;
    
    const store = await Store.findOneAndUpdate(
      { sellerId },
      { storeName, description, bannerImageURL },
      { new: true, upsert: true }
    );
    
    res.json({ success: true, data: store });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Đăng bán sản phẩm mới
exports.createProduct = async (req, res) => {
  try {
    const { title, description, price, image, categoryId, isAuction, auctionEndTime, quantity } = req.body;
    
    const product = new Product({
      title,
      description,
      price,
      image,
      categoryId,
      sellerId: req.user.id,
      isAuction,
      auctionEndTime
    });
    
    await product.save();
    
    // Tạo bản ghi tồn kho
    const inventory = new Inventory({
      productId: product._id,
      quantity: quantity || 0
    });
    await inventory.save();
    
    res.status(201).json({ success: true, data: { product, inventory } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Quản lý danh sách sản phẩm
exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find({ sellerId: req.user.id });
    res.json({ success: true, data: products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, sellerId: req.user.id },
      req.body,
      { new: true }
    );
    
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }
    
    res.json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findOneAndDelete({ 
      _id: req.params.id, 
      sellerId: req.user.id 
    });
    
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }
    
    // Xóa inventory liên quan
    await Inventory.findOneAndDelete({ productId: req.params.id });
    
    res.json({ success: true, message: "Product deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Quản lý tồn kho
exports.getInventory = async (req, res) => {
  try {
    // Lấy tất cả sản phẩm của seller
    const products = await Product.find({ sellerId: req.user.id });
    const productIds = products.map(p => p._id);
    
    // Lấy inventory của các sản phẩm đó
    const inventory = await Inventory.find({ productId: { $in: productIds } })
      .populate("productId", "title");
    
    res.json({ success: true, data: inventory });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateInventory = async (req, res) => {
  try {
    const { quantity } = req.body;
    
    // Kiểm tra sản phẩm thuộc về seller
    const product = await Product.findOne({ 
      _id: req.params.productId, 
      sellerId: req.user.id 
    });
    
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }
    
    const inventory = await Inventory.findOneAndUpdate(
      { productId: req.params.productId },
      { quantity },
      { new: true, upsert: true }
    );
    
    res.json({ success: true, data: inventory });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Xác nhận đơn hàng và in phiếu vận chuyển
exports.confirmOrder = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    
    // Kiểm tra đơn hàng có sản phẩm của seller
    const orderItems = await OrderItem.find({ orderId })
      .populate({
        path: 'productId',
        select: 'sellerId'
      });
    
    const sellerItems = orderItems.filter(item => 
      item.productId.sellerId.toString() === req.user.id
    );
    
    if (sellerItems.length === 0) {
      return res.status(404).json({ success: false, message: "No items found for this seller" });
    }
    
    // Cập nhật trạng thái đơn hàng
    await OrderItem.updateMany(
      { _id: { $in: sellerItems.map(i => i._id) } },
      { status: "shipping" }
    );
    
    // Tạo thông tin vận chuyển
    const shippingInfos = await Promise.all(sellerItems.map(async (item) => {
      const shippingInfo = new ShippingInfo({
        orderItemId: item._id,
        trackingNumber: `TRK-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        status: "shipping"
      });
      await shippingInfo.save();
      return shippingInfo;
    }));
    
    res.json({
      success: true,
      message: "Order confirmed",
      data: shippingInfos
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Xem đánh giá sản phẩm
exports.getProductReviews = async (req, res) => {
  try {
    // Lấy tất cả sản phẩm của seller
    const products = await Product.find({ sellerId: req.user.id });
    const productIds = products.map(p => p._id);
    
    // Lấy đánh giá của các sản phẩm đó
    const reviews = await Review.find({ productId: { $in: productIds } })
      .populate("reviewerId", "username")
      .populate("productId", "title");
    
    res.json({ success: true, data: reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Gửi phản hồi hệ thống (Feedback)
exports.submitFeedback = async (req, res) => {
  try {
    const { content } = req.body;
    
    // Tạo feedback
    const feedback = new Feedback({
      sellerId: req.user.id,
      content
    });
    
    await feedback.save();
    
    res.status(201).json({ success: true, data: feedback });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Báo cáo doanh số
exports.getSalesReport = async (req, res) => {
  try {
    const { period } = req.query; // week, month, year
    const sellerId = req.user.id;
    
    // Lấy tất cả sản phẩm của seller
    const products = await Product.find({ sellerId });
    const productIds = products.map(p => p._id);
    
    // Lấy tất cả order items liên quan
    const orderItems = await OrderItem.find({ productId: { $in: productIds } })
      .populate({
        path: "orderId",
        select: "orderDate"
      });
    
    // Lọc theo khoảng thời gian
    const now = new Date();
    let startDate;
    
    switch (period) {
      case "week":
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case "month":
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      case "year":
        startDate = new Date(now.setFullYear(now.getFullYear() - 1));
        break;
      default:
        startDate = new Date(0); // Tất cả
    }
    
    const filteredItems = orderItems.filter(item => 
      item.orderId && new Date(item.orderId.orderDate) >= startDate
    );
    
    // Tính toán báo cáo
    const report = {
      totalOrders: filteredItems.length,
      totalRevenue: filteredItems.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0),
      products: {}
    };
    
    // Thống kê theo sản phẩm
    products.forEach(product => {
      const productItems = filteredItems.filter(item => 
        item.productId.toString() === product._id.toString()
      );
      
      report.products[product.title] = {
        quantitySold: productItems.reduce((sum, item) => sum + item.quantity, 0),
        totalRevenue: productItems.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0)
      };
    });
    
    res.json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Quản lý khiếu nại
exports.getDisputes = async (req, res) => {
  try {
    // Lấy tất cả sản phẩm của seller
    const products = await Product.find({ sellerId: req.user.id });
    const productIds = products.map(p => p._id);
    
    const orderItems = await OrderItem.find({ productId: { $in: productIds } });
    const orderIds = [...new Set(orderItems.map(item => item.orderId.toString()))];
    
    // Lấy khiếu nại liên quan
    const disputes = await Dispute.find({ orderId: { $in: orderIds } })
      .populate("raisedBy", "username")
      .populate("orderId");
    
    res.json({ success: true, data: disputes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.resolveDispute = async (req, res) => {
  try {
    const { resolution, status } = req.body;
    
    const dispute = await Dispute.findById(req.params.id);
    
    if (!dispute) {
      return res.status(404).json({ success: false, message: "Dispute not found" });
    }
    
    // Kiểm tra seller có quyền
    const orderItem = await OrderItem.findOne({ orderId: dispute.orderId });
    if (!orderItem) {
      return res.status(404).json({ success: false, message: "Order item not found" });
    }
    
    const product = await Product.findById(orderItem.productId);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }
    
    if (product.sellerId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }
    
    dispute.resolution = resolution;
    dispute.status = status;
    await dispute.save();
    
    res.json({ success: true, data: dispute });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};