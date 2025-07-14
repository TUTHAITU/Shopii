const {
  User,
  Store,
  Category,
  Product,
  Order,
  OrderItem,
  Dispute,
  Coupon,
  Feedback,
  Review,
} = require("../models");
const logger = require("../utils/logger");
const mongoose = require("mongoose");

// --- Hàm Hỗ Trợ Xử Lý Lỗi (Helper Function for Error Responses) ---
// Hàm này giúp chuẩn hóa việc xử lý và phản hồi lỗi.
const handleError = (res, error, message = "Lỗi Máy Chủ", statusCode = 500) => {
  logger.error(`${message}: `, error); // Ghi log lỗi chi tiết
  // Trả về phản hồi JSON với mã trạng thái và thông báo lỗi.
  res
    .status(statusCode)
    .json({ success: false, message, error: error.message });
};

// --- Quản Lý Người Dùng (User Management) ---

/**
 * @desc Lấy tất cả người dùng với phân trang và lọc
 * @route GET /api/admin/users?page=<page>&limit=<limit>
 * @access Riêng tư (Admin)
 */
exports.getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    let query = {};

    // Filter by search
    if (req.query.search) {
      query.$or = [
        { username: { $regex: req.query.search, $options: "i" } },
        { email: { $regex: req.query.search, $options: "i" } },
      ];
    }

    // Filter by role
    if (req.query.role) {
      query.role = req.query.role;
    }

    // Filter by action
    if (req.query.action) {
      query.action = req.query.action;
    }

    const users = await User.find(query)
      .select("-password")
      .skip(skip)
      .limit(limit);
    const totalUsers = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      data: users,
      totalPages: Math.ceil(totalUsers / limit),
      currentPage: page,
    });
  } catch (error) {
    handleError(res, error, "Lỗi khi lấy danh sách người dùng");
  }
};

/**
 * @desc Lấy chi tiết một người dùng bằng ID
 * @route GET /api/admin/users/:userId
 * @access Riêng tư (Admin)
 */
exports.getUserDetails = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select("-password");
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "Người dùng không tồn tại" });
    }
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    handleError(res, error, "Lỗi khi lấy chi tiết người dùng");
  }
};
/**
 * @desc Xóa một người dùng bởi Admin
 * @route DELETE /api/admin/users/:userId
 * @access Riêng tư (Admin)
 */
exports.deleteUserByAdmin = async (req, res) => {
  const { userId } = req.params;
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "Người dùng không tồn tại" });
    }
    await User.findByIdAndDelete(userId);
    res
      .status(200)
      .json({ success: true, message: "Xóa người dùng thành công" });
  } catch (error) {
    handleError(res, error, "Lỗi khi xóa người dùng");
  }
};
/**
 * @desc Cập nhật chi tiết người dùng (vai trò, trạng thái khóa/mở khóa) bởi Admin
 * @route PUT /api/admin/users/:userId
 * @access Riêng tư (Admin)
 */
exports.updateUserByAdmin = async (req, res) => {
  const { userId } = req.params;
  const { role, action, username, email } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "Người dùng không tồn tại" });
    }

    if (username) user.username = username;
    if (email) user.email = email;
    if (role && ["buyer", "seller", "admin"].includes(role)) {
      user.role = role;
    }
    if (action && ["lock", "unlock"].includes(action)) {
      user.action = action;
    }

    await user.save();
    const userToReturn = user.toObject();
    delete userToReturn.password;

    res.status(200).json({
      success: true,
      message: "Cập nhật người dùng thành công",
      data: userToReturn,
    });
  } catch (error) {
    if (error.code === 11000 && error.keyPattern && error.keyPattern.email) {
      return handleError(res, error, "Email đã được sử dụng.", 400);
    }
    handleError(res, error, "Lỗi khi cập nhật người dùng");
  }
};
// --- Quản Lý Cửa Hàng (Store Management) ---

/**
 * @desc Lấy tất cả cửa hàng (có thể lọc theo trạng thái, hỗ trợ pagination và tùy chọn tính rating từ Feedback)
 * @route GET /api/admin/stores
 * @query withRatings=true để bao gồm rating
 * @access Riêng tư (Admin)
 */
exports.getAllStoresAdmin = async (req, res) => {
  const { status, page = 1, limit = 10, withRatings = false } = req.query;
  try {
    const query = {};
    if (status && ["pending", "approved", "rejected"].includes(status)) {
      query.status = status;
    }
    let stores = await Store.find(query)
      .populate("sellerId", "username email")
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    const total = await Store.countDocuments(query);

    if (withRatings === "true") {
      // Thêm rating từ Feedback cho từng store
      stores = await Promise.all(
        stores.map(async (store) => {
          const storeObj = store.toObject(); // Chuyển sang object để thêm field

          // Lấy feedback của seller
          const feedback = await Feedback.findOne({ sellerId: store.sellerId });

          storeObj.averageRating = feedback ? feedback.averageRating : 0;
          storeObj.totalReviews = feedback ? feedback.totalReviews : 0;

          return storeObj;
        })
      );
    }

    res.status(200).json({
      success: true,
      count: stores.length,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      data: stores,
    });
  } catch (error) {
    handleError(res, error, "Lỗi khi lấy danh sách cửa hàng");
  }
};

/**
 * @desc Lấy chi tiết một cửa hàng bằng ID
 * @route GET /api/admin/stores/:storeId
 * @access Riêng tư (Admin)
 */
exports.getStoreDetails = async (req, res) => {
  try {
    const store = await Store.findById(req.params.storeId).populate(
      "sellerId",
      "username email"
    );
    if (!store) {
      return res
        .status(404)
        .json({ success: false, message: "Cửa hàng không tồn tại" });
    }
    res.status(200).json({ success: true, data: store });
  } catch (error) {
    handleError(res, error, "Lỗi khi lấy chi tiết cửa hàng");
  }
};

/**
 * @desc Cập nhật trạng thái cửa hàng (duyệt, từ chối)
 * @route PUT /api/admin/stores/:storeId/status
 * @access Riêng tư (Admin)
 */
exports.updateStoreStatusByAdmin = async (req, res) => {
  const { storeId } = req.params;
  const { status } = req.body;

  if (!status || !["approved", "rejected"].includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Trạng thái không hợp lệ. Phải là "approved" hoặc "rejected".',
    });
  }

  try {
    const store = await Store.findById(storeId);
    if (!store) {
      return res
        .status(404)
        .json({ success: false, message: "Cửa hàng không tồn tại" });
    }

    if (status === "approved" && store.sellerId) {
      const seller = await User.findById(store.sellerId);
      if (seller && seller.role === "buyer") {
        seller.role = "seller";
        await seller.save();
      }
    }

    store.status = status;
    await store.save();
    res.status(200).json({
      success: true,
      message: `Cửa hàng đã được ${
        status === "approved" ? "duyệt" : "từ chối"
      } thành công`,
      data: store,
    });
  } catch (error) {
    handleError(res, error, "Lỗi khi cập nhật trạng thái cửa hàng");
  }
};

/**
 * @desc Cập nhật toàn bộ thông tin cửa hàng
 * @route PUT /api/admin/stores/:storeId
 * @access Riêng tư (Admin)
 */
exports.updateStoreByAdmin = async (req, res) => {
  const { storeId } = req.params;
  const {
    storeName,
    description,
    bannerImageURL,
    status,
    address,
    contactInfo,
  } = req.body;

  try {
    const store = await Store.findById(storeId);
    if (!store) {
      return res
        .status(404)
        .json({ success: false, message: "Cửa hàng không tồn tại" });
    }

    if (storeName) store.storeName = storeName;
    if (description) store.description = description;
    if (bannerImageURL) store.bannerImageURL = bannerImageURL;
    if (status && ["pending", "approved", "rejected"].includes(status)) {
      if (status === "approved" && store.sellerId) {
        const seller = await User.findById(store.sellerId);
        if (seller && seller.role === "buyer") {
          seller.role = "seller";
          await seller.save();
        }
      }
      store.status = status;
    }
    if (address) store.address = address;
    if (contactInfo) store.contactInfo = contactInfo;

    await store.save();
    res.status(200).json({
      success: true,
      message: "Cập nhật cửa hàng thành công",
      data: store,
    });
  } catch (error) {
    handleError(res, error, "Lỗi khi cập nhật cửa hàng");
  }
};
// --- Quản Lý Sản Phẩm (Product Management) ---

/**
 * @desc Lấy tất cả sản phẩm (có thể lọc theo sellerId, categoryId, status, hỗ trợ phân trang)
 * @route GET /api/admin/products
 * @access Riêng tư (Admin)
 */
exports.getAllProductsAdmin = async (req, res) => {
  const { sellerId, categoryId, status, page = 1, limit = 10 } = req.query;
  try {
    const query = {};
    if (sellerId) query.sellerId = sellerId;
    if (categoryId) query.categoryId = categoryId;
    if (status && ["available", "out_of_stock", "pending"].includes(status)) {
      // Điều chỉnh enum dựa trên DB mới
      query.status = status;
    }
    const products = await Product.find(query)
      .populate("sellerId", "username email")
      .populate("categoryId", "name")
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    const total = await Product.countDocuments(query);
    res.status(200).json({
      success: true,
      count: products.length,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      data: products,
    });
  } catch (error) {
    handleError(res, error, "Lỗi khi lấy danh sách sản phẩm");
  }
};

/**
 * @desc Lấy chi tiết một sản phẩm bằng ID
 * @route GET /api/admin/products/:id
 * @access Riêng tư (Admin)
 */
exports.getProductDetailsAdmin = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate("sellerId", "username email")
      .populate("categoryId", "name");
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Sản phẩm không tồn tại" });
    }
    res.status(200).json({ success: true, data: product });
  } catch (error) {
    handleError(res, error, "Lỗi khi lấy chi tiết sản phẩm");
  }
};

/**
 * @desc Cập nhật trạng thái sản phẩm
 * @route PUT /api/admin/products/:id/status
 * @access Riêng tư (Admin)
 */
exports.updateProductStatusAdmin = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status || !["available", "out_of_stock", "pending"].includes(status)) {
    // Điều chỉnh enum dựa trên DB mới
    return res.status(400).json({
      success: false,
      message:
        'Trạng thái không hợp lệ. Phải là "available", "out_of_stock" hoặc "pending".',
    });
  }

  try {
    const product = await Product.findById(id);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Sản phẩm không tồn tại" });
    }

    product.status = status;
    await product.save();
    res.status(200).json({
      success: true,
      message: `Sản phẩm đã được cập nhật trạng thái thành ${status} thành công`,
      data: product,
    });
  } catch (error) {
    handleError(res, error, "Lỗi khi cập nhật trạng thái sản phẩm");
  }
};

/**
 * @desc Xóa sản phẩm vi phạm
 * @route DELETE /api/admin/products/:id
 * @access Riêng tư (Admin)
 */
exports.deleteProductAdmin = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Sản phẩm không tồn tại" });
    }
    // Có thể thêm logic xóa liên quan như reviews, inventory, etc. nếu cần
    res.status(200).json({ success: true, message: "Xóa sản phẩm thành công" });
  } catch (error) {
    handleError(res, error, "Lỗi khi xóa sản phẩm");
  }
};

/**
 * @desc Đếm và phân tích số lượng sản phẩm theo store (sellerId) hoặc trạng thái
 * @route GET /api/admin/products/stats
 * @access Riêng tư (Admin)
 */
exports.getProductStatsAdmin = async (req, res) => {
  try {
    const statsByStore = await Product.aggregate([
      { $group: { _id: "$sellerId", count: { $sum: 1 } } },
      {
        $lookup: {
          from: "stores",
          localField: "_id",
          foreignField: "sellerId",
          as: "store",
        },
      },
      { $unwind: "$store" },
      { $project: { storeName: "$store.storeName", count: 1 } },
    ]);

    const statsByStatus = await Product.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    res.status(200).json({
      success: true,
      statsByStore,
      statsByStatus,
    });
  } catch (error) {
    handleError(res, error, "Lỗi khi lấy thống kê sản phẩm");
  }
};

/**
 * @desc Lấy tất cả đánh giá (lọc theo productId, reviewerId, hoặc storeId, hỗ trợ phân trang)
 * @route GET /api/admin/reviews
 * @access Riêng tư (Admin)
 */
exports.getAllReviewsAdmin = async (req, res) => {
  const { productId, reviewerId, storeId, page = 1, limit = 10 } = req.query;
  try {
    let match = {};
    if (productId) match.productId = new mongoose.Types.ObjectId(productId);
    if (reviewerId) match.reviewerId = new mongoose.Types.ObjectId(reviewerId);
    if (storeId) {
      // Lọc theo storeId: review -> product -> sellerId (store.sellerId == storeId)
      const seller = await Store.findById(storeId).select("sellerId");
      if (!seller)
        return res
          .status(404)
          .json({ success: false, message: "Cửa hàng không tồn tại" });
      const products = await Product.find({ sellerId: seller.sellerId }).select(
        "_id"
      );
      match.productId = { $in: products.map((p) => p._id) };
    }

    const reviews = await Review.aggregate([
      { $match: match },
      { $skip: (page - 1) * limit },
      { $limit: parseInt(limit) },
      {
        $lookup: {
          from: "products",
          localField: "productId",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: "$product" },
      {
        $lookup: {
          from: "users",
          localField: "reviewerId",
          foreignField: "_id",
          as: "reviewer",
        },
      },
      { $unwind: "$reviewer" },
      {
        $project: {
          rating: 1,
          comment: 1,
          createdAt: 1,
          "product.title": 1,
          "reviewer.username": 1,
        },
      },
    ]);

    const total = await Review.countDocuments(match);

    res.status(200).json({
      success: true,
      count: reviews.length,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      data: reviews,
    });
  } catch (error) {
    handleError(res, error, "Lỗi khi lấy danh sách đánh giá");
  }
};
/**
 * @desc Xóa đánh giá không hợp lệ
 * @route DELETE /api/admin/reviews/:id
 * @access Riêng tư (Admin)
 */
exports.deleteReviewAdmin = async (req, res) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) {
      return res
        .status(404)
        .json({ success: false, message: "Đánh giá không tồn tại" });
    }
    // Có thể cập nhật lại feedback của seller nếu cần
    res.status(200).json({ success: true, message: "Xóa đánh giá thành công" });
  } catch (error) {
    handleError(res, error, "Lỗi khi xóa đánh giá");
  }
};

/**
 * @desc Lấy tất cả đánh giá của một sản phẩm và tính trung bình rating, tổng lượt review
 * @route GET /api/admin/products/:id/reviews
 * @access Công khai hoặc Riêng tư tùy theo yêu cầu (ở đây giả sử Admin hoặc công khai)
 */
exports.getProductReviewsAndStats = async (req, res) => {
  const { id } = req.params;
  console.info(`Starting getProductReviewsAndStats for product ID: ${id}`);

  try {
    // Kiểm tra sản phẩm tồn tại
    const product = await Product.findById(id);
    if (!product) {
      console.warn(`Product not found for ID: ${id}`);
      return res
        .status(404)
        .json({ success: false, message: "Sản phẩm không tồn tại" });
    }

    console.info(`Product found for ID: ${id}`);

    // Lấy tất cả reviews của sản phẩm
    const reviews = await Review.find({ productId: id })
      .populate("reviewerId", "username fullname")
      .sort({ createdAt: -1 }); // Sắp xếp mới nhất trước

    // Tính toán trung bình rating và tổng lượt review sử dụng aggregation
    const stats = await Review.aggregate([
      { $match: { productId: new mongoose.Types.ObjectId(id) } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 },
        },
      },
    ]);

    const averageRating = stats.length > 0 ? stats[0].averageRating : 0;
    const totalReviews = stats.length > 0 ? stats[0].totalReviews : 0;

    res.status(200).json({
      success: true,
      averageRating: averageRating.toFixed(1), // Làm tròn 1 chữ số thập phân
      totalReviews,
      data: reviews,
    });
  } catch (error) {
    console.error(
      `Error in getProductReviewsAndStats for product ID: ${id}: ${error.message}`
    );
    handleError(res, error, "Lỗi khi lấy đánh giá sản phẩm");
  }
};

// // --- Quản Lý Danh Mục (Category Management) ---

// /**
//  * @desc Tạo một danh mục mới
//  * @route POST /api/admin/categories
//  * @access Riêng tư (Admin)
//  */
// exports.createCategoryAdmin = async (req, res) => {
//   const { name } = req.body; // Lấy tên danh mục từ request body
//   if (!name) {
//     return res
//       .status(400)
//       .json({ success: false, message: "Tên danh mục là bắt buộc" });
//   }
//   try {
//     // Kiểm tra xem danh mục đã tồn tại chưa (dựa trên trường 'name' là unique)
//     const existingCategory = await Category.findOne({ name });
//     if (existingCategory) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Danh mục với tên này đã tồn tại" });
//     }
//     const category = await Category.create({ name }); // Tạo danh mục mới
//     res.status(201).json({
//       success: true,
//       message: "Tạo danh mục thành công",
//       data: category,
//     });
//   } catch (error) {
//     handleError(res, error, "Lỗi khi tạo danh mục");
//   }
// };

// /**
//  * @desc Lấy tất cả danh mục
//  * @route GET /api/admin/categories
//  * @access Riêng tư (Admin) hoặc Công khai (tùy theo yêu cầu)
//  */
// exports.getCategoriesAdmin = async (req, res) => {
//   try {
//     const categories = await Category.find(); // Lấy tất cả danh mục
//     res
//       .status(200)
//       .json({ success: true, count: categories.length, data: categories });
//   } catch (error) {
//     handleError(res, error, "Lỗi khi lấy danh sách danh mục");
//   }
// };

// /**
//  * @desc Cập nhật một danh mục
//  * @route PUT /api/admin/categories/:categoryId
//  * @access Riêng tư (Admin)
//  */
// exports.updateCategoryAdmin = async (req, res) => {
//   const { categoryId } = req.params; // Lấy ID danh mục
//   const { name } = req.body; // Lấy tên mới
//   if (!name) {
//     return res.status(400).json({
//       success: false,
//       message: "Tên danh mục là bắt buộc để cập nhật",
//     });
//   }
//   try {
//     // Tìm và cập nhật danh mục, trả về bản ghi mới (new: true), chạy validators (runValidators: true)
//     const category = await Category.findByIdAndUpdate(
//       categoryId,
//       { name },
//       { new: true, runValidators: true }
//     );
//     if (!category) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Danh mục không tồn tại" });
//     }
//     res.status(200).json({
//       success: true,
//       message: "Cập nhật danh mục thành công",
//       data: category,
//     });
//   } catch (error) {
//     if (error.code === 11000) {
//       // Xử lý lỗi trùng tên
//       return handleError(res, error, "Danh mục với tên này đã tồn tại.", 400);
//     }
//     handleError(res, error, "Lỗi khi cập nhật danh mục");
//   }
// };

// /**
//  * @desc Xóa một danh mục
//  * @route DELETE /api/admin/categories/:categoryId
//  * @access Riêng tư (Admin)
//  */
// exports.deleteCategoryAdmin = async (req, res) => {
//   const { categoryId } = req.params;
//   try {
//     const category = await Category.findById(categoryId);
//     if (!category) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Danh mục không tồn tại" });
//     }
//     // TODO: Cân nhắc điều gì xảy ra với các sản phẩm thuộc danh mục này.
//     // Option 1: Không cho phép xóa nếu có sản phẩm tồn tại. (Đã triển khai)
//     // Option 2: Đặt category của sản phẩm thành null hoặc một danh mục mặc định.
//     // Option 3: Xóa luôn các sản phẩm đó (nguy hiểm).
//     const productsInCategory = await Product.countDocuments({
//       categoryId: categoryId,
//     });
//     if (productsInCategory > 0) {
//       return res.status(400).json({
//         success: false,
//         message: `Không thể xóa danh mục. Có ${productsInCategory} sản phẩm đang liên kết với danh mục này.`,
//       });
//     }

//     await Category.findByIdAndDelete(categoryId); // Xóa danh mục
//     res.status(200).json({ success: true, message: "Xóa danh mục thành công" });
//   } catch (error) {
//     handleError(res, error, "Lỗi khi xóa danh mục");
//   }
// };

// // --- Quản Lý Tranh Chấp (Dispute Management) ---

// /**
//  * @desc Lấy tất cả các tranh chấp
//  * @route GET /api/admin/
//  * @access Riêng tư (Admin)
//  */
// exports.getAllDisputesAdmin = async (req, res) => {
//   try {
//     // Tìm tất cả tranh chấp, populate thông tin đơn hàng và người tạo tranh chấp.
//     const disputes = await Dispute.find()
//       .populate("orderId", "orderDate totalPrice status") // Lấy các trường cần thiết từ Order
//       .populate("raisedBy", "username email"); // Lấy username, email từ User
//     res
//       .status(200)
//       .json({ success: true, count: disputes.length, data: disputes });
//   } catch (error) {
//     handleError(res, error, "Lỗi khi lấy danh sách tranh chấp");
//   }
// };

// /**
//  * @desc Cập nhật một tranh chấp (trạng thái, giải pháp)
//  * @route PUT /api/admin/disputes/:disputeId
//  * @access Riêng tư (Admin)
//  */
// exports.updateDisputeByAdmin = async (req, res) => {
//   const { disputeId } = req.params;
//   const { status, resolution } = req.body; // Lấy trạng thái và giải pháp từ request body

//   // Kiểm tra đầu vào
//   if (!status && !resolution) {
//     return res.status(400).json({
//       success: false,
//       message: "Cần cung cấp trạng thái hoặc giải pháp để cập nhật.",
//     });
//   }
//   if (
//     status &&
//     !["open", "under_review", "resolved", "closed"].includes(status)
//   ) {
//     return res
//       .status(400)
//       .json({ success: false, message: "Trạng thái tranh chấp không hợp lệ." });
//   }

//   try {
//     const dispute = await Dispute.findById(disputeId);
//     if (!dispute) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Tranh chấp không tồn tại" });
//     }

//     if (status) dispute.status = status; // Cập nhật trạng thái nếu có
//     if (resolution) dispute.resolution = resolution; // Cập nhật giải pháp nếu có

//     await dispute.save(); // Lưu thay đổi
//     res.status(200).json({
//       success: true,
//       message: "Cập nhật tranh chấp thành công",
//       data: dispute,
//     });
//   } catch (error) {
//     handleError(res, error, "Lỗi khi cập nhật tranh chấp");
//   }
// };

// // --- Bảng Điều Khiển Admin (Admin Dashboard) ---
// /**
//  * @desc Lấy các số liệu thống kê cho bảng điều khiển admin
//  * @route GET /api/admin/dashboard/stats
//  * @access Riêng tư (Admin)
//  */
// exports.getAdminDashboardStats = async (req, res) => {
//   try {
//     // Đếm số lượng các bản ghi
//     const totalUsers = await User.countDocuments();
//     const totalSellers = await User.countDocuments({ role: "seller" }); // Đếm người dùng có vai trò 'seller'
//     const totalProducts = await Product.countDocuments();
//     const totalOrders = await Order.countDocuments();
//     const pendingStores = await Store.countDocuments({ status: "pending" }); // Đếm cửa hàng đang chờ duyệt
//     const openDisputes = await Dispute.countDocuments({ status: "open" }); // Đếm tranh chấp đang mở

//     // Có thể thêm các số liệu khác nếu cần (ví dụ: tổng doanh thu, đơn hàng gần đây)

//     res.status(200).json({
//       success: true,
//       data: {
//         totalUsers,
//         totalSellers,
//         totalProducts,
//         totalOrders,
//         pendingStores,
//         openDisputes,
//       },
//     });
//   } catch (error) {
//     handleError(res, error, "Lỗi khi lấy số liệu thống kê cho dashboard");
//   }
// };
// /**
//  * @desc Lấy tất cả đơn hàng (dành cho Admin)
//  * @route GET /api/admin/orders
//  * @access Riêng tư (Admin)
//  */
// exports.getAllOrdersAdmin = async (req, res) => {
//   try {
//     // TODO: Có thể thêm phân trang và bộ lọc (ví dụ: theo trạng thái, khoảng ngày)
//     const orders = await Order.find()
//       .populate("buyerId", "username email") // Lấy thông tin người mua
//       .populate({
//         path: "addressId", // Lấy đầy đủ thông tin địa chỉ giao hàng
//         model: "Address",
//       })
//       .sort({ orderDate: -1 }); // Sắp xếp theo đơn hàng mới nhất lên đầu

//     res.status(200).json({ success: true, count: orders.length, data: orders });
//   } catch (error) {
//     handleError(res, error, "Lỗi khi lấy danh sách tất cả đơn hàng");
//   }
// };

// /**
//  * @desc Lấy chi tiết một đơn hàng cụ thể bởi Admin
//  * @route GET /api/admin/orders/:orderId
//  * @access Riêng tư (Admin)
//  */
// exports.getOrderDetailsAdmin = async (req, res) => {
//   try {
//     // Tìm đơn hàng theo ID và populate thông tin người mua, địa chỉ
//     const order = await Order.findById(req.params.orderId)
//       .populate("buyerId", "username email")
//       .populate({
//         path: "addressId",
//         model: "Address",
//       });

//     if (!order) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Đơn hàng không tồn tại" });
//     }

//     // Tìm và populate các mục hàng (order items) thuộc đơn hàng này, kèm thông tin sản phẩm
//     const orderItems = await OrderItem.find({ orderId: order._id }).populate(
//       "productId",
//       "title image price"
//     ); // Lấy thông tin sản phẩm cho từng mục

//     // Trả về thông tin đơn hàng cùng với danh sách các mục hàng chi tiết
//     res.status(200).json({
//       success: true,
//       data: { ...order.toObject(), items: orderItems },
//     });
//   } catch (error) {
//     handleError(res, error, "Lỗi khi lấy chi tiết đơn hàng");
//   }
// };

// /**
//  * @desc Cập nhật trạng thái đơn hàng bởi Admin (ví dụ: xác nhận vận chuyển, đánh dấu thất bại)
//  * @route PUT /api/admin/orders/:orderId/status
//  * @access Riêng tư (Admin)
//  */
// exports.updateOrderStatusAdmin = async (req, res) => {
//   const { orderId } = req.params;
//   const { status } = req.body; // Ví dụ: "shipping", "shipped", "failed to ship", "rejected"

//   // Kiểm tra tính hợp lệ của trạng thái
//   if (
//     !status ||
//     !["pending", "shipping", "shipped", "failed to ship", "rejected"].includes(
//       status
//     )
//   ) {
//     return res
//       .status(400)
//       .json({ success: false, message: "Trạng thái đơn hàng không hợp lệ." });
//   }

//   try {
//     const order = await Order.findById(orderId);
//     if (!order) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Đơn hàng không tồn tại." });
//     }

//     order.status = status; // Cập nhật trạng thái đơn hàng
//     // Tùy chọn: cập nhật trạng thái cho tất cả các OrderItem liên quan
//     await OrderItem.updateMany({ orderId: order._id }, { status: status });

//     await order.save(); // Lưu thay đổi
//     res.status(200).json({
//       success: true,
//       message: "Cập nhật trạng thái đơn hàng thành công.",
//       data: order,
//     });
//   } catch (error) {
//     handleError(res, error, "Lỗi khi cập nhật trạng thái đơn hàng.");
//   }
// };

// // --- Kiểm Duyệt Đánh Giá và Phản Hồi (MỚI) ---

// /**
//  * @desc Lấy tất cả đánh giá sản phẩm (dành cho Admin)
//  * @route GET /api/admin/reviews
//  * @access Riêng tư (Admin)
//  */
// exports.getAllReviewsAdmin = async (req, res) => {
//   try {
//     // TODO: Có thể thêm phân trang và bộ lọc (ví dụ: theo rating, theo sản phẩm)
//     const reviews = await Review.find()
//       .populate("productId", "title") // Lấy tên sản phẩm
//       .populate("reviewerId", "username") // Lấy tên người đánh giá
//       .sort({ createdAt: -1 }); // Sắp xếp theo đánh giá mới nhất

//     res
//       .status(200)
//       .json({ success: true, count: reviews.length, data: reviews });
//   } catch (error) {
//     handleError(res, error, "Lỗi khi lấy danh sách tất cả đánh giá sản phẩm");
//   }
// };

// /**
//  * @desc Xóa một đánh giá sản phẩm bởi Admin
//  * @route DELETE /api/admin/reviews/:reviewId
//  * @access Riêng tư (Admin)
//  */
// exports.deleteReviewByAdmin = async (req, res) => {
//   const { reviewId } = req.params;
//   try {
//     const review = await Review.findById(reviewId);
//     if (!review) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Đánh giá không tồn tại" });
//     }

//     await Review.findByIdAndDelete(reviewId); // Xóa đánh giá
//     // TODO: Cân nhắc việc xóa đánh giá có nên kích hoạt tính toán lại
//     // điểm đánh giá trung bình của sản phẩm hoặc tóm tắt Feedback của người bán hay không.
//     // Hiện tại, hàm này chỉ xóa bản ghi đánh giá.

//     res.status(200).json({ success: true, message: "Xóa đánh giá thành công" });
//   } catch (error) {
//     handleError(res, error, "Lỗi khi xóa đánh giá");
//   }
// };

// /**
//  * @desc Lấy tất cả các tóm tắt phản hồi của người bán (dành cho Admin)
//  * @route GET /api/admin/seller-feedback
//  * @access Riêng tư (Admin)
//  */
// exports.getAllSellerFeedbackAdmin = async (req, res) => {
//   try {
//     // Lấy danh sách các bản ghi Feedback (tóm tắt đánh giá của người bán)
//     const feedbackSummaries = await Feedback.find()
//       .populate("sellerId", "username storeName") // Lấy thông tin người bán
//       .sort({ updatedAt: -1 }); // Sắp xếp theo lần cập nhật gần nhất

//     res.status(200).json({
//       success: true,
//       count: feedbackSummaries.length,
//       data: feedbackSummaries,
//     });
//   } catch (error) {
//     handleError(res, error, "Lỗi khi lấy danh sách phản hồi của người bán");
//   }
// };

// --- Quản Lý Dashboard (Dashboard Management) ---

/**
 * @desc Lấy báo cáo tổng quan cho dashboard admin (hỗ trợ lọc theo period: week, month, year, hoặc all time)
 * @route GET /api/admin/report
 * @query period=week/month/year (optional, default all time)
 * @access Riêng tư (Admin)
 */
exports.getAdminReport = async (req, res) => {
  const { period } = req.query;
  try {
    let dateFilter = {};
    const now = new Date();
    if (period === "week") {
      const oneWeekAgo = new Date(now);
      oneWeekAgo.setDate(now.getDate() - 7);
      dateFilter = { createdAt: { $gte: oneWeekAgo } }; // Sử dụng createdAt cho các model
    } else if (period === "month") {
      const oneMonthAgo = new Date(now);
      oneMonthAgo.setMonth(now.getMonth() - 1);
      dateFilter = { createdAt: { $gte: oneMonthAgo } };
    } else if (period === "year") {
      const oneYearAgo = new Date(now);
      oneYearAgo.setFullYear(now.getFullYear() - 1);
      dateFilter = { createdAt: { $gte: oneYearAgo } };
    }

    // Tính tổng doanh thu từ orders shipped
    const totalRevenueStats = await Order.aggregate([
      { $match: { ...dateFilter, status: "completed" } },
      { $group: { _id: null, totalRevenue: { $sum: "$totalPrice" } } },
    ]);
    const totalRevenue =
      totalRevenueStats.length > 0 ? totalRevenueStats[0].totalRevenue : 0;

    // Tính số unique customers (buyerId unique từ orders)
    const uniqueCustomersStats = await Order.aggregate([
      { $match: dateFilter },
      { $group: { _id: "$buyerId" } },
      { $count: "uniqueCustomers" },
    ]);
    const uniqueCustomers =
      uniqueCustomersStats.length > 0
        ? uniqueCustomersStats[0].uniqueCustomers
        : 0;

    // Tính số products shipped (tổng quantity từ orderItems của orders shipped)
    const productsShippedStats = await Order.aggregate([
      { $match: { ...dateFilter, status: "completed" } },
      {
        $lookup: {
          from: "orderitems",
          localField: "_id",
          foreignField: "orderId",
          as: "items",
        },
      },
      { $unwind: "$items" },
      { $group: { _id: null, productsShipped: { $sum: "$items.quantity" } } },
    ]);
    const productsShipped =
      productsShippedStats.length > 0
        ? productsShippedStats[0].productsShipped
        : 0;

    // Doanh thu theo category (từ orderItems của orders shipped, group by product.categoryId)
    const revenueByCategory = await Order.aggregate([
      { $match: { ...dateFilter, status: "completed" } },
      {
        $lookup: {
          from: "orderitems",
          localField: "_id",
          foreignField: "orderId",
          as: "items",
        },
      },
      { $unwind: "$items" },
      {
        $lookup: {
          from: "products",
          localField: "items.productId",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: "$product" },
      {
        $group: {
          _id: "$product.categoryId",
          totalRevenue: {
            $sum: { $multiply: ["$items.quantity", "$items.unitPrice"] },
          },
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "_id",
          foreignField: "_id",
          as: "category",
        },
      },
      { $unwind: "$category" },
      { $project: { name: "$category.name", value: "$totalRevenue" } },
    ]);

    // Top destinations (group by address.city or country từ orders shipped)
    const topDestinations = await Order.aggregate([
      { $match: { ...dateFilter, status: "completed" } },
      {
        $lookup: {
          from: "addresses",
          localField: "addressId",
          foreignField: "_id",
          as: "address",
        },
      },
      { $unwind: "$address" },
      { $group: { _id: "$address.city", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      { $project: { name: "$_id", value: "$count" } },
    ]);

    // Doanh thu theo thời gian (group by date, ví dụ theo ngày)
    const revenueOverTime = await Order.aggregate([
      { $match: { ...dateFilter, status: "completed" } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$orderDate" } },
          revenue: { $sum: "$totalPrice" },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { date: "$_id", revenue: 1, _id: 0 } },
    ]);

    // Top products (từ orderItems của orders completed, group by productId)
    const topProducts = await Order.aggregate([
      { $match: { ...dateFilter, status: "completed" } },
      {
        $lookup: {
          from: "orderitems",
          localField: "_id",
          foreignField: "orderId",
          as: "items",
        },
      },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.productId",
          quantity: { $sum: "$items.quantity" },
          revenue: {
            $sum: { $multiply: ["$items.quantity", "$items.unitPrice"] },
          },
        },
      },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: "$product" },
      { $sort: { revenue: -1 } },
      { $limit: 5 },
      { $project: { product: "$product.title", quantity: 1, revenue: 1 } },
    ]);

    // Top categories by number of products
    const topCategoriesByProducts = await Product.aggregate([
      { $match: dateFilter },
      { $group: { _id: "$categoryId", count: { $sum: 1 } } },
      {
        $lookup: {
          from: "categories",
          localField: "_id",
          foreignField: "_id",
          as: "category",
        },
      },
      { $unwind: "$category" },
      { $sort: { count: -1 } },
      { $limit: 5 },
      { $project: { name: "$category.name", value: "$count" } },
    ]);

    // Recent Activity: Fetch last 10 from various models, merge and sort
    const recentUsers = await User.find(dateFilter)
      .select("username createdAt")
      .sort({ createdAt: -1 })
      .limit(10)
      .lean()
      .exec()
      .then((docs) =>
        docs.map((d) => ({
          type: "New User",
          details: d.username,
          createdAt: d.createdAt,
        }))
      );
    const recentStores = await Store.find(dateFilter)
      .select("storeName createdAt")
      .sort({ createdAt: -1 })
      .limit(10)
      .lean()
      .exec()
      .then((docs) =>
        docs.map((d) => ({
          type: "New Store",
          details: d.storeName,
          createdAt: d.createdAt,
        }))
      );
    const recentProducts = await Product.find(dateFilter)
      .select("title createdAt")
      .sort({ createdAt: -1 })
      .limit(10)
      .lean()
      .exec()
      .then((docs) =>
        docs.map((d) => ({
          type: "New Product",
          details: d.title,
          createdAt: d.createdAt,
        }))
      );
    const recentOrders = await Order.find(dateFilter)
      .select("totalPrice createdAt")
      .sort({ createdAt: -1 })
      .limit(10)
      .lean()
      .exec()
      .then((docs) =>
        docs.map((d) => ({
          type: "New Order",
          details: `Total: ${d.totalPrice}`,
          createdAt: d.createdAt,
        }))
      );
    const recentReviews = await Review.find(dateFilter)
      .select("rating createdAt")
      .sort({ createdAt: -1 })
      .limit(10)
      .lean()
      .exec()
      .then((docs) =>
        docs.map((d) => ({
          type: "New Review",
          details: `Rating: ${d.rating}`,
          createdAt: d.createdAt,
        }))
      );

    const recentActivity = [
      ...recentUsers,
      ...recentStores,
      ...recentProducts,
      ...recentOrders,
      ...recentReviews,
    ]
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 10); // Lấy 10 mới nhất

    // Top 5 new users
    const top5NewUsers = await User.find(dateFilter)
      .select("username fullname email createdAt")
      .sort({ createdAt: -1 })
      .limit(5);

    // Top 5 new sellers (users with role "seller")
    const top5NewSellers = await User.find({ ...dateFilter, role: "seller" })
      .select("username fullname email createdAt")
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      data: {
        totalRevenue,
        uniqueCustomers,
        productsShipped,
        revenueByCategory,
        topDestinations,
        revenueOverTime,
        topProducts,
        topCategoriesByProducts,
        recentActivity,
        top5NewUsers,
        top5NewSellers,
      },
    });
  } catch (error) {
    handleError(res, error, "Lỗi khi lấy báo cáo dashboard");
  }
};
