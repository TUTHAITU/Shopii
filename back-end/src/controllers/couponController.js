const { Coupon, Product } = require('../models');

const getCouponsBySeller = async (req, res) => {
  try {
    const sellerId = req.user.id;

    // Tìm tất cả sản phẩm của seller
    const products = await Product.find({ sellerId }).select('_id');
    const productIds = products.map(product => product._id);

    // Tìm tất cả coupon có productId trong danh sách sản phẩm
    const coupons = await Coupon.find({ productId: { $in: productIds } }).populate('productId', 'title');

    if (!coupons || coupons.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy coupon nào' });
    }

    res.json(coupons);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

const addCoupon = async (req, res) => {
  try {
    const { code, discountPercent, endDate, maxUsage, productId } = req.body;
    const sellerId = req.user.id;

    const newCoupon = new Coupon({
      code,
      discountPercent,
      endDate,
      maxUsage,
      productId,
      sellerId,
    });

    await newCoupon.save();

    res.status(201).json(newCoupon);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

const updateCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const { code, discountPercent, endDate, maxUsage, productId } = req.body;
    const sellerId = req.user.id;

    const coupon = await Coupon.findOne({ _id: id, sellerId });
    if (!coupon) {
      return res.status(404).json({ message: 'Không tìm thấy coupon' });
    }

    coupon.code = code || coupon.code;
    coupon.discountPercent = discountPercent || coupon.discountPercent;
    coupon.endDate = endDate || coupon.endDate;
    coupon.maxUsage = maxUsage || coupon.maxUsage;
    coupon.productId = productId || coupon.productId;

    await coupon.save();

    res.json(coupon);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

const deleteCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const sellerId = req.user.id;

    const coupon = await Coupon.findOneAndDelete({ _id: id, sellerId });
    if (!coupon) {
      return res.status(404).json({ message: 'Không tìm thấy coupon' });
    }

    res.json({ message: 'Đã xóa coupon' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

module.exports = {
    getCouponsBySeller,
    addCoupon,
    updateCoupon,
    deleteCoupon,
};