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
const Category = require("../models/Category");
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

// Lấy thông tin hồ sơ cửa hàng (profile) của seller hiện tại
exports.getProfileStore = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const store = await Store.findOne({ sellerId }).populate('sellerId');

    if (!store) {
      return res.status(404).json({ success: false, message: "Store profile not found" });
    }
    res.json({ success: true, data: store });
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
// Lấy tất cả danh mục
exports.getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find();
    if (!categories || categories.length === 0) {
      return res.status(404).json({ success: false, message: "No categories found" });
    }
    res.json({ success: true, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
exports.addNewCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    // Kiểm tra xem category đã tồn tại chưa
    const existingCategory = await Category.findOne({ name });
    if (existingCategory) {
      return res.status(400).json({ success: false, message: "Category already exists" });
    }

    // Tạo mới category
    const newCategory = new Category({
      name,
      description
    });

    await newCategory.save();

    res.status(201).json({
      success: true,
      message: "Category added successfully!",
      data: newCategory
    });
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
    const productIds = products.map(p => p._id);

    const productsList = await Inventory.find({ productId: { $in: productIds } })
      .populate({ path: "productId",populate: {path: "categoryId" } });
      // .populate("productId", "name description price")  // Lấy thêm các thuộc tính name, description, price từ Product
      // .select("quantity location");  // Lấy thêm các thuộc tính quantity, location từ Inventory
    res.json({ success: true, data: productsList });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// Lấy chi tiết 1 sản phẩm
exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }
    // Lấy thêm thông tin tồn kho nếu cần
    const productsDetail = await Inventory.find({ productId: id})
      .populate({ path: "productId",populate: {path: "categoryId" } });

    // const inventory = await Inventory.findOne({ productId: id });
    // product.inStock = inventory ? inventory.quantity : 0;

    res.json({ success: true, data: productsDetail });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// Lấy tất cả review của 1 sản phẩm
exports.getReviewsByProductId = async (req, res) => {
  try {
    const { id } = req.params; // id là productId

    const reviews = await Review.find({ productId: id })
      .populate('reviewerId', 'username')
      .sort({ createdAt: -1 }); // mới nhất lên đầu

    res.json({ success: true, data: reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    // 1. Cập nhật product
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, sellerId: req.user.id },
      req.body,
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    // 2. Nếu request có quantity thì cập nhật Inventory
    if (typeof req.body.quantity !== 'undefined') {
      await Inventory.findOneAndUpdate(
        { productId: product._id },
        { quantity: req.body.quantity },
        { new: true }
      );
    }

    // 3. Lấy lại product và populate categoryId
    const populatedProduct = await Product.findById(product._id)
      .populate('categoryId', 'name');

    // 4. Lấy quantity trong Inventory
    const inventory = await Inventory.findOne({ productId: product._id });

    res.json({
      success: true,
      data: {
        product: populatedProduct,
        categoryName: populatedProduct.categoryId?.name || null,
        quantity: inventory ? inventory.quantity : 0
      }
    });
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