const Product = require('../models/Product');

const listAllProducts = async (req, res) => {
  try {
    const products = await Product.find().populate('categoryId').populate('sellerId');
    res.status(200).json({
      success: true,
      data: products
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
module.exports = {
  listAllProducts
};