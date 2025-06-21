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
const ReturnRequest = require('../models/ReturnRequest');
const Address = require('../models/Address');
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

exports.getProfileStoreAndSeller = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const store = await Store.findOne({ sellerId }).populate('sellerId');
    if (!store) {
      return res.status(404).json({ success: false, message: "Store profile not found" });
    }

    // Lấy tất cả product của store này
    const products = await Product.find({ sellerId }, '_id');
    const productIds = products.map(p => p._id);

    // Lấy review gốc (parentId == null) của tất cả product
    const reviews = await Review.find(
      { productId: { $in: productIds }, parentId: null },
      'rating'
    );
    const totalReviews = reviews.length;
    const avgRating = totalReviews
      ? (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / totalReviews).toFixed(1)
      : 0;

    // Lấy địa chỉ mặc định của user
    const address = await Address.findOne({ userId: store.sellerId._id, isDefault: true });

    // Trả về response gồm địa chỉ
    res.json({
      success: true,
      data: {
        ...store.toObject(),
        avgRating: Number(avgRating),
        totalReviews,
        address // có thể null nếu user chưa khai báo
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
// Update seller's user profile
// exports.updateSellerProfile = async (req, res) => {
//   try {
//     const sellerId = req.user.id;
//     const { username, fullname, email, avatar } = req.body;

//     // Cập nhật các trường cho user
//     const updatedUser = await User.findByIdAndUpdate(
//       sellerId,
//       { username, fullname, email, avatar },
//       { new: true }
//     ).select("-password"); // Không trả về password

//     if (!updatedUser) {
//       return res.status(404).json({ success: false, message: "Seller not found" });
//     }

//     res.json({ success: true, data: updatedUser });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };
exports.updateSellerProfile = async (req, res) => {
  try {
    const sellerId = req.user.id;
    // Lấy các trường user và address từ body
    const { username, fullname, email, avatar, phone, street, city, state, country } = req.body;

    // 1. Cập nhật User
    const updatedUser = await User.findByIdAndUpdate(
      sellerId,
      { username, fullname, email, avatarURL: avatar }, // Lưu ý: avatar hay avatarURL
      { new: true }
    ).select("-password"); // Không trả về password

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: "Seller not found" });
    }

    // 2. Cập nhật địa chỉ mặc định
    let updatedAddress = null;
    if (phone || street || city || state || country) {
      // Upsert địa chỉ mặc định (isDefault: true)
      updatedAddress = await Address.findOneAndUpdate(
        { userId: sellerId, isDefault: true },
        {
          phone, street, city, state, country, fullName: fullname || updatedUser.fullname, isDefault: true
        },
        { new: true, upsert: true }
      );
    }

    res.json({
      success: true,
      data: {
        ...updatedUser.toObject(),
        address: updatedAddress
      }
    });
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
      .populate({ path: "productId", populate: { path: "categoryId" } });
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
    const productsDetail = await Inventory.find({ productId: id })
      .populate({ path: "productId", populate: { path: "categoryId" } });

    // const inventory = await Inventory.findOne({ productId: id });
    // product.inStock = inventory ? inventory.quantity : 0;

    res.json({ success: true, data: productsDetail });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// Lấy tất cả review của 1 sản phẩm
// exports.getReviewsByProductId = async (req, res) => {
//   try {
//     const { id } = req.params; // id là productId

//     const reviews = await Review.find({ productId: id })
//       .populate('reviewerId', 'username')
//       .sort({ createdAt: -1 }); // mới nhất lên đầu

//     res.json({ success: true, data: reviews });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };
exports.getReviewsByProductId = async (req, res) => {
  try {
    const { id } = req.params; // id là productId

    // Lấy tất cả review & populate user
    const reviews = await Review.find({ productId: id })
      .populate('reviewerId', 'username role')
      .sort({ createdAt: -1 });

    // Lấy userIds là seller để tìm cửa hàng
    const sellerUserIds = reviews
      .filter(r => r.reviewerId && r.reviewerId.role === "seller")
      .map(r => r.reviewerId._id);

    // Map: userId -> { storeName, bannerImageURL }
    let storeMap = {};
    if (sellerUserIds.length) {
      const stores = await Store.find(
        { sellerId: { $in: sellerUserIds } },
        "sellerId storeName bannerImageURL"
      );
      storeMap = stores.reduce((acc, s) => {
        acc[s.sellerId.toString()] = {
          storeName: s.storeName,
          bannerImageURL: s.bannerImageURL,
        };
        return acc;
      }, {});
    }

    // Gắn thêm storeName và bannerImageURL vào review nếu reviewer là seller
    const reviewsWithStore = reviews.map(r => {
      let reviewObj = r.toObject();
      if (r.reviewerId && r.reviewerId.role === "seller") {
        const storeInfo = storeMap[r.reviewerId._id.toString()] || {};
        reviewObj.storeName = storeInfo.storeName || "";
        reviewObj.storeBanner = storeInfo.bannerImageURL || "";
      }
      return reviewObj;
    });

    res.json({ success: true, data: reviewsWithStore });
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
// Lấy tất cả yêu cầu trả hàng liên quan tới seller hiện tại
exports.getReturnRequests = async (req, res) => {
  try {
    // Lấy tất cả sản phẩm của seller
    const products = await Product.find({ sellerId: req.user.id }, '_id');
    const productIds = products.map(p => p._id);

    // Lấy orderItems của các sản phẩm này
    const orderItems = await OrderItem.find({ productId: { $in: productIds } }, '_id');
    const orderItemIds = orderItems.map(oi => oi._id);

    // Lấy returnRequest liên quan
    const returnRequests = await ReturnRequest.find({ orderItemId: { $in: orderItemIds } })
      .populate({
        path: 'orderItemId',
        populate: [
          { path: 'productId', select: 'title image' },
          { path: 'orderId' }
        ]
      })
      .populate({ path: 'userId', select: 'username fullname' })
      .sort({ createdAt: -1 });

    res.json({ success: true, data: returnRequests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Cập nhật trạng thái yêu cầu trả hàng (approved/rejected/completed)
exports.updateReturnRequest = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ["pending", "approved", "rejected", "completed"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    const returnRequest = await ReturnRequest.findById(req.params.id)
      .populate({
        path: 'orderItemId',
        populate: { path: 'productId' }
      });

    if (!returnRequest) {
      return res.status(404).json({ success: false, message: "Return request not found" });
    }

    // Check quyền: chỉ seller của product mới được cập nhật
    const product = returnRequest.orderItemId.productId;
    if (product.sellerId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    returnRequest.status = status;
    await returnRequest.save();

    res.json({ success: true, data: returnRequest });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
exports.getDisputes = async (req, res) => {
  try {
    // Lấy tất cả sản phẩm của seller
    const products = await Product.find({ sellerId: req.user.id });
    const productIds = products.map(p => p._id);

    // Tìm tất cả orderItems thuộc về các sản phẩm này
    const orderItems = await OrderItem.find({ productId: { $in: productIds } }, '_id');
    const orderItemIds = orderItems.map(item => item._id);

    // Lấy các Dispute liên quan đến các orderItem của seller
    const disputes = await Dispute.find({ orderItemId: { $in: orderItemIds } })
      .populate('raisedBy', 'username fullname')
      .populate({
        path: 'orderItemId',
        populate: [
          {
            path: 'productId',
            select: 'title image',
          },
          {
            path: 'orderId',
            // Để lấy thông tin order nếu cần
          },
        ],
      })
      .sort({ createdAt: -1 });

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

    // Lấy orderItem qua dispute.orderItemId
    const orderItem = await OrderItem.findById(dispute.orderItemId);
    if (!orderItem) {
      return res.status(404).json({ success: false, message: "Order item not found" });
    }

    // Lấy product để kiểm tra seller có quyền xử lý
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


// Lịch sử đơn hàng của seller
// exports.getOrderHistory = async (req, res) => {
//   try {
//     // Lấy tất cả sản phẩm của seller này
//     const products = await Product.find({ sellerId: req.user.id }, "_id");
//     const productIds = products.map(p => p._id);

//     // Lấy các OrderItem thuộc về seller
//     const orderItems = await OrderItem.find({ productId: { $in: productIds }, status: { $in: ["shipped", "rejected"] } })
//       .populate({
//         path: "orderId",
//         populate: [
//           { path: "buyerId", select: "username email fullname" },
//           { path: "addressId" }
//         ]
//       })
//       .populate({
//         path: "productId",
//         select: "title image categoryId",
//         populate: { path: "categoryId", select: "name" }
//       });

//     res.json({ success: true, data: orderItems });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

exports.getOrderHistory = async (req, res) => {
  try {
    // 1. Lấy tất cả sản phẩm của seller này
    const products = await Product.find({ sellerId: req.user.id }, "_id");
    const productIds = products.map(p => p._id);

    // 2. Lấy các OrderItem thuộc về seller
    const orderItems = await OrderItem.find({
        productId: { $in: productIds },
        status: { $in: ["shipped"] }
      })
      .populate({
        path: "orderId",
        populate: [
          { path: "buyerId", select: "username email fullname" },
          { path: "addressId" }
        ]
      })
      .populate({
        path: "productId",
        select: "title image categoryId",
        populate: { path: "categoryId", select: "name" }
      })
      .lean();

    // 3. Lấy ShippingInfo theo orderItemId
    const orderItemIds = orderItems.map(x => x._id);
    const shippingInfos = await ShippingInfo.find({ orderItemId: { $in: orderItemIds } }).lean();

    // 4. Gán ShippingInfo vào từng OrderItem
    const shippingMap = {};
    shippingInfos.forEach(info => {
      shippingMap[info.orderItemId.toString()] = info;
    });

    const result = orderItems.map(item => ({
      ...item,
      shippingInfo: shippingMap[item._id.toString()] || null
    }));

    // 5. Trả về kết quả
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// Thêm vào sellerController.js
exports.replyToReview = async (req, res) => {
  try {
    const { comment } = req.body;
    const { productId, reviewId } = req.params;

    // Kiểm tra seller sở hữu sản phẩm này không
    const product = await Product.findById(productId);
    if (!product || product.sellerId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    // Kiểm tra review gốc tồn tại
    const parentReview = await Review.findById(reviewId);
    if (!parentReview || parentReview.productId.toString() !== productId) {
      return res.status(404).json({ success: false, message: "Review not found" });
    }

    // Chỉ cho phép seller trả lời 1 lần (nếu muốn)
    const existedReply = await Review.findOne({ parentId: reviewId, reviewerId: req.user.id });
    if (existedReply) {
      return res.status(400).json({ success: false, message: "Already replied" });
    }

    // Tạo reply
    const reply = new Review({
      productId,
      reviewerId: req.user.id,
      comment,
      parentId: reviewId
      // Không cần rating
    });

    await reply.save();

    res.status(201).json({ success: true, data: reply });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


