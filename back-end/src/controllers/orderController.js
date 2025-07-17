// orderController.js

const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const Voucher = require('../models/Voucher');
const Inventory = require('../models/Inventory');
const Product = require('../models/Product');
const User = require('../models/User'); // Add this import to fetch user details
const { sendEmail } = require('../services/emailService'); // Add this import assuming emailService.js is in services folder

const createOrder = async (req, res) => {
  const { selectedItems, selectedAddressId, couponCode, paymentMethod } = req.body;
  const buyerId = req.user.id; // Assumed from auth middleware (e.g., authMiddleware1 sets req.user)

  if (!selectedAddressId || !selectedItems || selectedItems.length === 0) {
    return res.status(400).json({ error: 'Missing required fields: address or items' });
  }

  try {
    // Fetch buyer details for email
    const buyer = await User.findById(buyerId);
    if (!buyer || !buyer.email) {
      return res.status(400).json({ error: 'Buyer email not found' });
    }
    const buyerEmail = buyer.email;

    // Step 1: Calculate subtotal and validate inventory/products
    let subtotal = 0;
    const productDetails = {};

    for (const item of selectedItems) {
      // Validate product exists
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(404).json({ error: `Product ${item.productId} not found` });
      }

      // Find or create inventory record
      let inventory = await Inventory.findOne({ productId: item.productId });
      
      // If inventory doesn't exist, create it with 0 quantity
      if (!inventory) {
        inventory = new Inventory({
          productId: item.productId,
          quantity: 0
        });
        await inventory.save();
      }
      
      // Validate inventory quantity
      if (inventory.quantity < item.quantity) {
        return res.status(400).json({ 
          error: `Insufficient inventory for product ${product.title} (ID: ${item.productId}). Available: ${inventory.quantity}, Requested: ${item.quantity}`
        });
      }

      const unitPrice = product.price;
      subtotal += unitPrice * item.quantity;
      productDetails[item.productId] = { unitPrice };
    }

    // Step 2: Apply voucher if provided
    let discount = 0;
    if (couponCode) {
      const voucher = await Voucher.findOne({ code: couponCode });
      if (!voucher || !voucher.isActive) {
        return res.status(400).json({ error: 'Invalid or inactive voucher' });
      }

      if (subtotal < voucher.minOrderValue) {
        return res.status(400).json({ error: `Order must be at least ${voucher.minOrderValue} to apply this voucher` });
      }

      if (voucher.discountType === 'fixed') {
        discount = voucher.discount;
      } else if (voucher.discountType === 'percentage') {
        const calculatedDiscount = (subtotal * voucher.discount) / 100;
        discount = voucher.maxDiscount > 0 ? Math.min(calculatedDiscount, voucher.maxDiscount) : calculatedDiscount;
      }

      // Increment usedCount and save (triggers pre-save hook to update isActive if needed)
      voucher.usedCount += 1;
      await voucher.save();
    }

    const totalPrice = Math.max(subtotal - discount, 0);

    // Step 3: Create the Order
    const order = new Order({
      buyerId,
      addressId: selectedAddressId,
      totalPrice,
      status: 'pending', // Default status
    });
    await order.save();

    // Step 4: Create OrderItems and deduct from inventory
    for (const item of selectedItems) {
      const orderItem = new OrderItem({
        orderId: order._id,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: productDetails[item.productId].unitPrice,
        status: 'pending', // Default status
      });
      await orderItem.save();

      // Deduct quantity from inventory - using upsert:false since we know inventory exists
      await Inventory.findOneAndUpdate(
        { productId: item.productId },
        { 
          $inc: { quantity: -item.quantity },
          $set: { lastUpdated: new Date() }
        },
        { upsert: false } // No upsert, assume inventory exists (we created it if needed above)
      );
    }

    // Step 5: Send email notification assuming payment is successful (e.g., for COD or post-order confirmation)
    // Note: If payment is handled separately (e.g., via gateway webhook), move this to a payment success handler.
    // For now, assuming order creation implies payment success for simplicity.
    try {
      const emailSubject = 'Payment Successful and Order Confirmation';
      const emailText = `Dear Customer,\n\nYour payment was successful, and your order has been placed.\nOrder ID: ${order._id}\nTotal Amount: ${totalPrice}\n\nThank you for shopping with us!`;
      await sendEmail(buyerEmail, emailSubject, emailText);
      console.log('Email sent successfully to:', buyerEmail);
    } catch (emailError) {
      console.error('Failed to send order confirmation email:', emailError);
      // Continue with order creation even if email fails
    }

    // Success response
    return res.status(201).json({ 
      message: 'Order placed successfully',
      orderId: order._id,
      totalPrice 
    });

  } catch (error) {
    console.error('Error creating order:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

module.exports = { createOrder };