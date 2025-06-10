
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
  } = require('../models');
  const logger = require('../utils/logger');
  
  // --- Hàm Hỗ Trợ Xử Lý Lỗi (Helper Function for Error Responses) ---
  // Hàm này giúp chuẩn hóa việc xử lý và phản hồi lỗi.
  const handleError = (res, error, message = 'Lỗi Máy Chủ', statusCode = 500) => {
    logger.error(`${message}: `, error); // Ghi log lỗi chi tiết
    // Trả về phản hồi JSON với mã trạng thái và thông báo lỗi.
    res.status(statusCode).json({ success: false, message, error: error.message });
  };
  
  // --- Quản Lý Người Dùng (User Management) ---
  
  /**
   * @desc Lấy tất cả người dùng (có thể thêm tùy chọn phân trang và lọc)
   * @route GET /api/admin/users
   * @access Riêng tư (Admin)
   */
  exports.getAllUsers = async (req, res) => {
    try {
      // TODO: Triển khai phân trang (ví dụ: req.query.page, req.query.limit)
      // Tìm tất cả người dùng, loại trừ trường 'password' ra khỏi kết quả.
      const users = await User.find().select('-password');
      // Trả về danh sách người dùng.
      res.status(200).json({ success: true, count: users.length, data: users });
    } catch (error) {
      handleError(res, error, 'Lỗi khi lấy danh sách người dùng');
    }
  };
  
  /**
   * @desc Lấy chi tiết một người dùng bằng ID
   * @route GET /api/admin/users/:userId
   * @access Riêng tư (Admin)
   */
  exports.getUserDetails = async (req, res) => {
    try {
      // Tìm người dùng bằng ID được cung cấp trong URL params, loại trừ mật khẩu.
      const user = await User.findById(req.params.userId).select('-password');
      if (!user) {
        // Nếu không tìm thấy người dùng, trả về lỗi 404.
        return res.status(404).json({ success: false, message: 'Người dùng không tồn tại' });
      }
      // Trả về chi tiết người dùng.
      res.status(200).json({ success: true, data: user });
    } catch (error) {
      handleError(res, error, 'Lỗi khi lấy chi tiết người dùng');
    }
  };
  
  /**
   * @desc Cập nhật chi tiết người dùng (ví dụ: vai trò, trạng thái khóa/mở khóa) bởi Admin
   * @route PUT /api/admin/users/:userId
   * @access Riêng tư (Admin)
   */
  exports.updateUserByAdmin = async (req, res) => {
    const { userId } = req.params; // Lấy ID người dùng từ URL
    const { role, action, fullname, email } = req.body; // Lấy thông tin cần cập nhật từ request body
  
    try {
      const user = await User.findById(userId); // Tìm người dùng
      if (!user) {
        return res.status(404).json({ success: false, message: 'Người dùng không tồn tại' });
      }
  
      // Cập nhật các trường nếu chúng được cung cấp
      if (fullname) user.fullname = fullname;
      if (email) user.email = email; // Cân nhắc việc thay đổi email (trường unique)
      if (role && ['buyer', 'seller', 'admin'].includes(role)) { // Kiểm tra vai trò hợp lệ
        user.role = role;
      }
      if (action && ['lock', 'unlock'].includes(action)) { // Kiểm tra hành động hợp lệ
        user.action = action;
      }
  
      await user.save(); // Lưu thay đổi
      // Tạo một bản sao của đối tượng user để loại bỏ mật khẩu trước khi gửi về client
      const userToReturn = user.toObject();
      delete userToReturn.password;
  
      res.status(200).json({ success: true, message: 'Cập nhật người dùng thành công', data: userToReturn });
    } catch (error) {
      if (error.code === 11000 && error.keyPattern && error.keyPattern.email) { // Xử lý lỗi trùng email
          return handleError(res, error, 'Email đã được sử dụng.', 400);
      }
      handleError(res, error, 'Lỗi khi cập nhật người dùng');
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
        return res.status(404).json({ success: false, message: 'Người dùng không tồn tại' });
      }
  
      // Cân nhắc điều gì sẽ xảy ra với dữ liệu liên quan (ví dụ: sản phẩm, đơn hàng) khi xóa người dùng.
      // Điều này có thể liên quan đến việc xóa mềm (soft delete) hoặc logic dọn dẹp phức tạp hơn.
      await User.findByIdAndDelete(userId); // Xóa người dùng khỏi cơ sở dữ liệu
  
      res.status(200).json({ success: true, message: 'Xóa người dùng thành công' });
    } catch (error) {
      handleError(res, error, 'Lỗi khi xóa người dùng');
    }
  };
  
  // --- Quản Lý Cửa Hàng (Store Management) ---
  
  /**
   * @desc Lấy tất cả cửa hàng (có thể lọc theo trạng thái, ví dụ: đang chờ duyệt)
   * @route GET /api/admin/stores
   * @access Riêng tư (Admin)
   */
  exports.getAllStoresAdmin = async (req, res) => {
    const { status } = req.query; // Ví dụ: /api/admin/stores?status=pending
    try {
      const query = {}; // Tạo đối tượng query rỗng
      if (status && ['pending', 'approved', 'rejected'].includes(status)) {
        query.status = status; // Nếu có status hợp lệ, thêm vào query
      }
      // Tìm cửa hàng, populate thông tin người bán (chỉ lấy username, fullname, email)
      const stores = await Store.find(query).populate('sellerId', 'username fullname email');
      res.status(200).json({ success: true, count: stores.length, data: stores });
    } catch (error) {
      handleError(res, error, 'Lỗi khi lấy danh sách cửa hàng');
    }
  };
  
  /**
   * @desc Cập nhật trạng thái cửa hàng (duyệt, từ chối)
   * @route PUT /api/admin/stores/:storeId/status
   * @access Riêng tư (Admin)
   */
  exports.updateStoreStatusByAdmin = async (req, res) => {
    const { storeId } = req.params; // Lấy ID cửa hàng
    const { status } = req.body; // Trạng thái mong muốn: 'approved' hoặc 'rejected'
  
    // Kiểm tra tính hợp lệ của status
    if (!status || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Trạng thái không hợp lệ. Phải là "approved" hoặc "rejected".' });
    }
  
    try {
      const store = await Store.findById(storeId);
      if (!store) {
        return res.status(404).json({ success: false, message: 'Cửa hàng không tồn tại' });
      }
  
      // Nếu duyệt cửa hàng, đồng thời cập nhật vai trò của người dùng thành 'seller' nếu họ đang là 'buyer'
      if (status === 'approved' && store.sellerId) {
          const seller = await User.findById(store.sellerId);
          if (seller && seller.role === 'buyer') {
              seller.role = 'seller'; // Thay đổi vai trò
              await seller.save(); // Lưu lại người dùng
          }
      }
  
      store.status = status; // Cập nhật trạng thái cửa hàng
      await store.save(); // Lưu thay đổi
      res.status(200).json({ success: true, message: `Cửa hàng đã được ${status === 'approved' ? 'duyệt' : 'từ chối'} thành công`, data: store });
    } catch (error) {
      handleError(res, error, 'Lỗi khi cập nhật trạng thái cửa hàng');
    }
  };
  
  // --- Quản Lý Danh Mục (Category Management) ---
  
  /**
   * @desc Tạo một danh mục mới
   * @route POST /api/admin/categories
   * @access Riêng tư (Admin)
   */
  exports.createCategoryAdmin = async (req, res) => {
    const { name } = req.body; // Lấy tên danh mục từ request body
    if (!name) {
      return res.status(400).json({ success: false, message: 'Tên danh mục là bắt buộc' });
    }
    try {
      // Kiểm tra xem danh mục đã tồn tại chưa (dựa trên trường 'name' là unique)
      const existingCategory = await Category.findOne({ name });
      if (existingCategory) {
        return res.status(400).json({ success: false, message: 'Danh mục với tên này đã tồn tại' });
      }
      const category = await Category.create({ name }); // Tạo danh mục mới
      res.status(201).json({ success: true, message: 'Tạo danh mục thành công', data: category });
    } catch (error) {
      handleError(res, error, 'Lỗi khi tạo danh mục');
    }
  };
  
  /**
   * @desc Lấy tất cả danh mục
   * @route GET /api/admin/categories
   * @access Riêng tư (Admin) hoặc Công khai (tùy theo yêu cầu)
   */
  exports.getCategoriesAdmin = async (req, res) => {
    try {
      const categories = await Category.find(); // Lấy tất cả danh mục
      res.status(200).json({ success: true, count: categories.length, data: categories });
    } catch (error) {
      handleError(res, error, 'Lỗi khi lấy danh sách danh mục');
    }
  };
  
  /**
   * @desc Cập nhật một danh mục
   * @route PUT /api/admin/categories/:categoryId
   * @access Riêng tư (Admin)
   */
  exports.updateCategoryAdmin = async (req, res) => {
    const { categoryId } = req.params; // Lấy ID danh mục
    const { name } = req.body; // Lấy tên mới
    if (!name) {
      return res.status(400).json({ success: false, message: 'Tên danh mục là bắt buộc để cập nhật' });
    }
    try {
      // Tìm và cập nhật danh mục, trả về bản ghi mới (new: true), chạy validators (runValidators: true)
      const category = await Category.findByIdAndUpdate(categoryId, { name }, { new: true, runValidators: true });
      if (!category) {
        return res.status(404).json({ success: false, message: 'Danh mục không tồn tại' });
      }
      res.status(200).json({ success: true, message: 'Cập nhật danh mục thành công', data: category });
    } catch (error) {
      if (error.code === 11000) { // Xử lý lỗi trùng tên
          return handleError(res, error, 'Danh mục với tên này đã tồn tại.', 400);
      }
      handleError(res, error, 'Lỗi khi cập nhật danh mục');
    }
  };
  
  /**
   * @desc Xóa một danh mục
   * @route DELETE /api/admin/categories/:categoryId
   * @access Riêng tư (Admin)
   */
  exports.deleteCategoryAdmin = async (req, res) => {
    const { categoryId } = req.params;
    try {
      const category = await Category.findById(categoryId);
      if (!category) {
        return res.status(404).json({ success: false, message: 'Danh mục không tồn tại' });
      }
      // TODO: Cân nhắc điều gì xảy ra với các sản phẩm thuộc danh mục này.
      // Option 1: Không cho phép xóa nếu có sản phẩm tồn tại. (Đã triển khai)
      // Option 2: Đặt category của sản phẩm thành null hoặc một danh mục mặc định.
      // Option 3: Xóa luôn các sản phẩm đó (nguy hiểm).
      const productsInCategory = await Product.countDocuments({ categoryId: categoryId });
      if (productsInCategory > 0) {
          return res.status(400).json({ success: false, message: `Không thể xóa danh mục. Có ${productsInCategory} sản phẩm đang liên kết với danh mục này.` });
      }
  
      await Category.findByIdAndDelete(categoryId); // Xóa danh mục
      res.status(200).json({ success: true, message: 'Xóa danh mục thành công' });
    } catch (error) {
      handleError(res, error, 'Lỗi khi xóa danh mục');
    }
  };
  
  // --- Quản Lý Tranh Chấp (Dispute Management) ---
  
  /**
   * @desc Lấy tất cả các tranh chấp
   * @route GET /api/admin/ 
   * @access Riêng tư (Admin)
   */
  exports.getAllDisputesAdmin = async (req, res) => {
    try {
      // Tìm tất cả tranh chấp, populate thông tin đơn hàng và người tạo tranh chấp.
      const disputes = await Dispute.find()
        .populate('orderId', 'orderDate totalPrice status') // Lấy các trường cần thiết từ Order
        .populate('raisedBy', 'username email'); // Lấy username, email từ User
      res.status(200).json({ success: true, count: disputes.length, data: disputes });
    } catch (error) {
      handleError(res, error, 'Lỗi khi lấy danh sách tranh chấp');
    }
  };
  
  /**
   * @desc Cập nhật một tranh chấp (trạng thái, giải pháp)
   * @route PUT /api/admin/disputes/:disputeId
   * @access Riêng tư (Admin)
   */
  exports.updateDisputeByAdmin = async (req, res) => {
    const { disputeId } = req.params;
    const { status, resolution } = req.body; // Lấy trạng thái và giải pháp từ request body
  
    // Kiểm tra đầu vào
    if (!status && !resolution) {
      return res.status(400).json({ success: false, message: 'Cần cung cấp trạng thái hoặc giải pháp để cập nhật.' });
    }
    if (status && !['open', 'under_review', 'resolved', 'closed'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Trạng thái tranh chấp không hợp lệ.' });
    }
  
    try {
      const dispute = await Dispute.findById(disputeId);
      if (!dispute) {
        return res.status(404).json({ success: false, message: 'Tranh chấp không tồn tại' });
      }
  
      if (status) dispute.status = status; // Cập nhật trạng thái nếu có
      if (resolution) dispute.resolution = resolution; // Cập nhật giải pháp nếu có
  
      await dispute.save(); // Lưu thay đổi
      res.status(200).json({ success: true, message: 'Cập nhật tranh chấp thành công', data: dispute });
    } catch (error) {
      handleError(res, error, 'Lỗi khi cập nhật tranh chấp');
    }
  };
  
  // --- Quản Lý Mã Giảm Giá (Coupon Management) ---
  
  /**
   * @desc Tạo một mã giảm giá mới
   * @route POST /api/admin/coupons
   * @access Riêng tư (Admin)
   */
  exports.createCouponAdmin = async (req, res) => {
    const { code, discountPercent, endDate, maxUsage, productId } = req.body;
    try {
      // Tạo mã giảm giá mới với các thông tin được cung cấp
      const newCoupon = await Coupon.create({
        code,
        discountPercent,
        endDate,
        maxUsage,
        productId: productId || null, // productId là tùy chọn
      });
      res.status(201).json({ success: true, message: 'Tạo mã giảm giá thành công', data: newCoupon });
    } catch (error) {
      if (error.code === 11000) { // Xử lý lỗi trùng mã 'code'
          return handleError(res, error, 'Mã giảm giá đã tồn tại.', 400);
      }
      // Trả về lỗi 400 cho các lỗi validation hoặc logic nghiệp vụ
      handleError(res, error, 'Lỗi khi tạo mã giảm giá', 400);
    }
  };
  
  /**
   * @desc Lấy tất cả các mã giảm giá
   * @route GET /api/admin/coupons
   * @access Riêng tư (Admin)
   */
  exports.getAllCouponsAdmin = async (req, res) => {
    try {
      // Tìm tất cả mã giảm giá, populate thông tin sản phẩm nếu có.
      const coupons = await Coupon.find().populate('productId', 'title price');
      res.status(200).json({ success: true, count: coupons.length, data: coupons });
    } catch (error) {
      handleError(res, error, 'Lỗi khi lấy danh sách mã giảm giá');
    }
  };
  
  /**
   * @desc Cập nhật một mã giảm giá
   * @route PUT /api/admin/coupons/:couponId
   * @access Riêng tư (Admin)
   */
  exports.updateCouponAdmin = async (req, res) => {
    const { couponId } = req.params;
    const updateData = req.body; // Dữ liệu cần cập nhật (ví dụ: { discountPercent, endDate, maxUsage })
    try {
      // Tìm và cập nhật mã giảm giá
      const coupon = await Coupon.findByIdAndUpdate(couponId, updateData, { new: true, runValidators: true });
      if (!coupon) {
        return res.status(404).json({ success: false, message: 'Mã giảm giá không tồn tại' });
      }
      res.status(200).json({ success: true, message: 'Cập nhật mã giảm giá thành công', data: coupon });
    } catch (error) {
       if (error.code === 11000 && error.keyPattern && error.keyPattern.code) { // Xử lý lỗi trùng mã 'code'
          return handleError(res, error, 'Mã giảm giá đã tồn tại.', 400);
      }
      handleError(res, error, 'Lỗi khi cập nhật mã giảm giá', 400);
    }
  };
  
  /**
   * @desc Xóa một mã giảm giá
   * @route DELETE /api/admin/coupons/:couponId
   * @access Riêng tư (Admin)
   */
  exports.deleteCouponAdmin = async (req, res) => {
    const { couponId } = req.params;
    try {
      const coupon = await Coupon.findByIdAndDelete(couponId); // Tìm và xóa mã giảm giá
      if (!coupon) {
        return res.status(404).json({ success: false, message: 'Mã giảm giá không tồn tại' });
      }
      res.status(200).json({ success: true, message: 'Xóa mã giảm giá thành công' });
    } catch (error) {
      handleError(res, error, 'Lỗi khi xóa mã giảm giá');
    }
  };
  
  // --- Quản Lý Sản Phẩm bởi Admin (Tùy chọn - ví dụ: xem tất cả, xóa bất kỳ sản phẩm nào) ---
  
  /**
   * @desc Lấy tất cả sản phẩm (dành cho Admin)
   * @route GET /api/admin/products
   * @access Riêng tư (Admin)
   */
  exports.getAllProductsAdmin = async (req, res) => {
    try {
      // Tìm tất cả sản phẩm, populate thông tin danh mục và người bán.
      const products = await Product.find()
        .populate('categoryId', 'name')
        .populate('sellerId', 'username storeName'); // Giả sử User model có storeName hoặc liên kết đến Store
      res.status(200).json({ success: true, count: products.length, data: products });
    } catch (error) {
      handleError(res, error, 'Lỗi khi lấy tất cả sản phẩm');
    }
  };
  
  /**
   * @desc Xóa một sản phẩm bởi Admin
   * @route DELETE /api/admin/products/:productId
   * @access Riêng tư (Admin)
   */
  exports.deleteProductByAdmin = async (req, res) => {
    const { productId } = req.params;
    try {
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ success: false, message: 'Sản phẩm không tồn tại' });
      }
      // Cân nhắc dọn dẹp thêm: xóa khỏi kho (inventory), bids, reviews, v.v.
      // hoặc xử lý thông qua pre-hooks của Mongoose model.
      await Product.findByIdAndDelete(productId);
      // Tùy chọn, xóa các bản ghi liên quan trong Inventory, Review, Bid...
      // await Inventory.deleteOne({ productId });
      // await Review.deleteMany({ productId });
      // await Bid.deleteMany({ productId });
  
      res.status(200).json({ success: true, message: 'Sản phẩm đã được xóa bởi admin' });
    } catch (error){
      handleError(res, error, 'Lỗi khi xóa sản phẩm bởi admin');
    }
  };
  
  // --- Bảng Điều Khiển Admin (Admin Dashboard) ---
  /**
   * @desc Lấy các số liệu thống kê cho bảng điều khiển admin
   * @route GET /api/admin/dashboard/stats
   * @access Riêng tư (Admin)
   */
  exports.getAdminDashboardStats = async (req, res) => {
    try {
      // Đếm số lượng các bản ghi
      const totalUsers = await User.countDocuments();
      const totalSellers = await User.countDocuments({ role: 'seller' }); // Đếm người dùng có vai trò 'seller'
      const totalProducts = await Product.countDocuments();
      const totalOrders = await Order.countDocuments();
      const pendingStores = await Store.countDocuments({ status: 'pending' }); // Đếm cửa hàng đang chờ duyệt
      const openDisputes = await Dispute.countDocuments({ status: 'open' }); // Đếm tranh chấp đang mở
  
      // Có thể thêm các số liệu khác nếu cần (ví dụ: tổng doanh thu, đơn hàng gần đây)
  
      res.status(200).json({
        success: true,
        data: {
          totalUsers,
          totalSellers,
          totalProducts,
          totalOrders,
          pendingStores,
          openDisputes,
        },
      });
    } catch (error) {
      handleError(res, error, 'Lỗi khi lấy số liệu thống kê cho dashboard');
    }
  };
/**
 * @desc Lấy tất cả đơn hàng (dành cho Admin)
 * @route GET /api/admin/orders
 * @access Riêng tư (Admin)
 */
exports.getAllOrdersAdmin = async (req, res) => {
    try {
      // TODO: Có thể thêm phân trang và bộ lọc (ví dụ: theo trạng thái, khoảng ngày)
      const orders = await Order.find()
        .populate('buyerId', 'username fullname email') // Lấy thông tin người mua
        .populate({
            path: 'addressId', // Lấy đầy đủ thông tin địa chỉ giao hàng
            model: 'Address'
        })
        .sort({ orderDate: -1 }); // Sắp xếp theo đơn hàng mới nhất lên đầu
  
      res.status(200).json({ success: true, count: orders.length, data: orders });
    } catch (error) {
      handleError(res, error, 'Lỗi khi lấy danh sách tất cả đơn hàng');
    }
  };
  
  /**
   * @desc Lấy chi tiết một đơn hàng cụ thể bởi Admin
   * @route GET /api/admin/orders/:orderId
   * @access Riêng tư (Admin)
   */
  exports.getOrderDetailsAdmin = async (req, res) => {
    try {
      // Tìm đơn hàng theo ID và populate thông tin người mua, địa chỉ
      const order = await Order.findById(req.params.orderId)
        .populate('buyerId', 'username fullname email')
        .populate({
            path: 'addressId',
            model: 'Address'
        });
  
      if (!order) {
        return res.status(404).json({ success: false, message: 'Đơn hàng không tồn tại' });
      }
  
      // Tìm và populate các mục hàng (order items) thuộc đơn hàng này, kèm thông tin sản phẩm
      const orderItems = await OrderItem.find({ orderId: order._id })
          .populate('productId', 'title image price'); // Lấy thông tin sản phẩm cho từng mục
  
      // Trả về thông tin đơn hàng cùng với danh sách các mục hàng chi tiết
      res.status(200).json({ success: true, data: { ...order.toObject(), items: orderItems } });
    } catch (error) {
      handleError(res, error, 'Lỗi khi lấy chi tiết đơn hàng');
    }
  };
  
  /**
   * @desc Cập nhật trạng thái đơn hàng bởi Admin (ví dụ: xác nhận vận chuyển, đánh dấu thất bại)
   * @route PUT /api/admin/orders/:orderId/status
   * @access Riêng tư (Admin)
   */
  exports.updateOrderStatusAdmin = async (req, res) => {
      const { orderId } = req.params;
      const { status } = req.body; // Ví dụ: "shipping", "shipped", "failed to ship", "rejected"
  
      // Kiểm tra tính hợp lệ của trạng thái
      if (!status || !['pending', 'shipping', 'shipped', 'failed to ship', 'rejected'].includes(status)) {
          return res.status(400).json({ success: false, message: 'Trạng thái đơn hàng không hợp lệ.' });
      }
  
      try {
          const order = await Order.findById(orderId);
          if (!order) {
              return res.status(404).json({ success: false, message: 'Đơn hàng không tồn tại.' });
          }
  
          order.status = status; // Cập nhật trạng thái đơn hàng
          // Tùy chọn: cập nhật trạng thái cho tất cả các OrderItem liên quan
          await OrderItem.updateMany({ orderId: order._id }, { status: status });
  
          await order.save(); // Lưu thay đổi
          res.status(200).json({ success: true, message: 'Cập nhật trạng thái đơn hàng thành công.', data: order });
      } catch (error) {
          handleError(res, error, 'Lỗi khi cập nhật trạng thái đơn hàng.');
      }
  };
  
  
  // --- Kiểm Duyệt Đánh Giá và Phản Hồi (MỚI) ---
  
  /**
   * @desc Lấy tất cả đánh giá sản phẩm (dành cho Admin)
   * @route GET /api/admin/reviews
   * @access Riêng tư (Admin)
   */
  exports.getAllReviewsAdmin = async (req, res) => {
    try {
      // TODO: Có thể thêm phân trang và bộ lọc (ví dụ: theo rating, theo sản phẩm)
      const reviews = await Review.find()
        .populate('productId', 'title') // Lấy tên sản phẩm
        .populate('reviewerId', 'username fullname') // Lấy tên người đánh giá
        .sort({ createdAt: -1 }); // Sắp xếp theo đánh giá mới nhất
  
      res.status(200).json({ success: true, count: reviews.length, data: reviews });
    } catch (error) {
      handleError(res, error, 'Lỗi khi lấy danh sách tất cả đánh giá sản phẩm');
    }
  };
  
  /**
   * @desc Xóa một đánh giá sản phẩm bởi Admin
   * @route DELETE /api/admin/reviews/:reviewId
   * @access Riêng tư (Admin)
   */
  exports.deleteReviewByAdmin = async (req, res) => {
    const { reviewId } = req.params;
    try {
      const review = await Review.findById(reviewId);
      if (!review) {
        return res.status(404).json({ success: false, message: 'Đánh giá không tồn tại' });
      }
  
      await Review.findByIdAndDelete(reviewId); // Xóa đánh giá
      // TODO: Cân nhắc việc xóa đánh giá có nên kích hoạt tính toán lại
      // điểm đánh giá trung bình của sản phẩm hoặc tóm tắt Feedback của người bán hay không.
      // Hiện tại, hàm này chỉ xóa bản ghi đánh giá.
  
      res.status(200).json({ success: true, message: 'Xóa đánh giá thành công' });
    } catch (error) {
      handleError(res, error, 'Lỗi khi xóa đánh giá');
    }
  };
  
  /**
   * @desc Lấy tất cả các tóm tắt phản hồi của người bán (dành cho Admin)
   * @route GET /api/admin/seller-feedback
   * @access Riêng tư (Admin)
   */
  exports.getAllSellerFeedbackAdmin = async (req, res) => {
    try {
      // Lấy danh sách các bản ghi Feedback (tóm tắt đánh giá của người bán)
      const feedbackSummaries = await Feedback.find()
        .populate('sellerId', 'username fullname storeName') // Lấy thông tin người bán
        .sort({ updatedAt: -1 }); // Sắp xếp theo lần cập nhật gần nhất
  
      res.status(200).json({ success: true, count: feedbackSummaries.length, data: feedbackSummaries });
    } catch (error) {
      handleError(res, error, 'Lỗi khi lấy danh sách phản hồi của người bán');
    }
  };
  
  // --- Bảng Điều Khiển Admin (Admin Dashboard) ---
  // (Hàm getAdminDashboardStats giữ nguyên, có thể thêm thống kê mới nếu cần)
  /**
   * @desc Lấy các số liệu thống kê cho bảng điều khiển admin
   * @route GET /api/admin/dashboard/stats
   * @access Riêng tư (Admin)
   */
  exports.getAdminDashboardStats = async (req, res) => {
    try {
      const totalUsers = await User.countDocuments();
      const totalSellers = await User.countDocuments({ role: 'seller' });
      const totalProducts = await Product.countDocuments();
      const totalOrders = await Order.countDocuments();
      const pendingStores = await Store.countDocuments({ status: 'pending' });
      const openDisputes = await Dispute.countDocuments({ status: 'open' });
      const totalReviews = await Review.countDocuments(); // Thêm thống kê tổng số đánh giá
  
      res.status(200).json({
        success: true,
        data: {
          totalUsers,
          totalSellers,
          totalProducts,
          totalOrders,
          pendingStores,
          openDisputes,
          totalReviews, // Thêm vào dữ liệu dashboard
        },
      });
    } catch (error) {
      handleError(res, error, 'Lỗi khi lấy số liệu thống kê cho dashboard');
    }
  };