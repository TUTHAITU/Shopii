import React from 'react';

function OrderSummary({ cart }) {
  const subtotal = cart.items.reduce(
    (sum, item) => sum + item.productId.price * item.quantity,
    0
  );
  const shipping = 0;
  const tax = 7;
  const total = subtotal + shipping + tax;

  return (
    <div className="bg-white p-6 shadow-md rounded">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Order Summary</h2>
      <div className="flex justify-between mb-2">
        <span className="text-gray-500">SUBTOTAL</span>
        <span className="text-gray-800 font-bold">${subtotal.toFixed(2)}</span>
      </div>
      <div className="flex justify-between mb-2">
        <span className="text-gray-500">SHIPPING</span>
        <span className="text-gray-800 font-bold">${shipping}</span>
      </div>
      <div className="flex justify-between mb-4">
        <span className="text-gray-500">TAX ESTIMATE</span>
        <span className="text-gray-800 font-bold">${tax}</span>
      </div>
      <div className="flex justify-between mb-6 text-lg font-bold text-gray-800">
        <span>TOTAL</span>
        <span>${total.toFixed(2)}</span>
      </div>
      <button
        onClick={() => window.location.href = '/checkout'}
        className="w-full bg-blue-900 text-white py-2 rounded"
      >
        CHECKOUT
      </button>
      <a
        onClick={() => window.location.href = '/'}
        className="block text-center text-blue-500 underline mt-2 cursor-pointer"
      >
        CONTINUE SHOPPING
      </a>
      <p className="text-center text-gray-500 text-sm mt-4">
        Tax included. Shipping calculated at checkout.
      </p>
      <div className="text-center mt-4">
        <span className="text-gray-500">SECURED PAYMENT WITH:</span>
        <div className="flex justify-center gap-2 mt-2">
          <img src="https://via.placeholder.com/24?text=Visa" alt="Visa" className="h-6" />
          <img src="https://via.placeholder.com/24?text=MC" alt="Mastercard" className="h-6" />
          <img src="https://via.placeholder.com/24?text=Amex" alt="Amex" className="h-6" />
          <img src="https://via.placeholder.com/24?text=PP" alt="PayPal" className="h-6" />
        </div>
      </div>
    </div>
  );
}

export default OrderSummary;