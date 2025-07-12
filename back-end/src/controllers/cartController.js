const Cart = require('../models/Cart');
const Product = require('../models/Product');

// Thêm sản phẩm vào giỏ hàng
const addToCart = async (req, res) => {
  try {
    const userId = req.user.id; // Lấy ID người dùng từ middleware xác thực
    const { productId, quantity } = req.body;

    // Xác thực đầu vào
    if (!productId || !quantity || quantity <= 0) {
      return res.status(400).json({ message: 'Invalid productId or quantity' });
    }

    // Kiểm tra xem sản phẩm có tồn tại không
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Tìm giỏ hàng của người dùng
    let cart = await Cart.findOne({ userId });
    if (cart) {
      // Nếu giỏ hàng đã tồn tại, kiểm tra xem sản phẩm đã có trong giỏ chưa
      const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId);
      if (itemIndex > -1) {
        // Nếu sản phẩm đã có, tăng số lượng
        cart.items[itemIndex].quantity += quantity;
      } else {
        // Nếu sản phẩm chưa có, thêm mới vào danh sách
        cart.items.push({ productId, quantity });
      }
    } else {
      // Nếu chưa có giỏ hàng, tạo mới
      cart = new Cart({
        userId,
        items: [{ productId, quantity }]
      });
    }

    // Lưu giỏ hàng
    await cart.save();
    res.status(200).json({ message: 'Item added to cart', cart });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Xem giỏ hàng
const viewCart = async (req, res) => {
  try {
    const userId = req.user.id;
    // Tìm giỏ hàng và populate thông tin sản phẩm
    const cart = await Cart.findOne({ userId }).populate('items.productId');
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }
    res.status(200).json(cart);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Cập nhật sản phẩm trong giỏ hàng
const updateCartItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const productId = req.params.productId; // Lấy productId từ URL
    const { quantity } = req.body;

    // Xác thực số lượng
    if (!quantity || quantity <= 0) {
      return res.status(400).json({ message: 'Quantity must be greater than 0' });
    }

    // Tìm giỏ hàng
    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    // Tìm sản phẩm trong giỏ hàng
    const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId);
    if (itemIndex > -1) {
      // Cập nhật số lượng
      cart.items[itemIndex].quantity = quantity;
      await cart.save();
      res.status(200).json({ message: 'Cart item updated', cart });
    } else {
      res.status(404).json({ message: 'Item not found in cart' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Xóa sản phẩm khỏi giỏ hàng
const deleteCartItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const productId = req.params.productId; // Lấy productId từ URL

    // Tìm giỏ hàng
    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    // Tìm và xóa sản phẩm
    const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId);
    if (itemIndex > -1) {
      cart.items.splice(itemIndex, 1);
      await cart.save();
      res.status(200).json({ message: 'Item removed from cart', cart });
    } else {
      res.status(404).json({ message: 'Item not found in cart' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Xuất các hàm
module.exports = {
  addToCart,
  viewCart,
  updateCartItem,
  deleteCartItem
};