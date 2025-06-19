import React, { useEffect, useState } from 'react';
import CartItem from '../components/CartItem';
import OrderSummary from '../components/OrderSummary';

function CartPage() {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCart = async () => {
      try {
        const mockCart = {
          items: [
            {
              productId: {
                _id: '1',
                title: 'Basic Starter Pack',
                price: 399,
                color: '8 colors',
                size: 'Small',
                stock: 10,
                imageUrl: 'https://via.placeholder.com/100?text=Blazer'
              },
              quantity: 1
            },
            {
              productId: {
                _id: '2',
                title: 'PINK BLOUSE',
                price: 1490,
                color: 'Black',
                size: 'Medium',
                stock: 0,
                imageUrl: 'https://via.placeholder.com/100?text=Blouse'
              },
              quantity: 1
            },
            {
              productId: {
                _id: '3',
                title: 'PREMIUM SUIT',
                price: 1399,
                color: 'Yellow',
                size: 'Large',
                stock: 5,
                imageUrl: 'https://via.placeholder.com/100?text=Suit'
              },
              quantity: 1
            }
          ]
        };
        setCart(mockCart);
      } catch (err) {
        setError('Failed to load cart. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchCart();
  }, []);

  const handleUpdateCart = (updatedItems) => {
    setCart({ ...cart, items: updatedItems });
  };

  if (loading) return <div className="text-center mt-10">Loading...</div>;
  if (error) return <div className="text-center mt-10 text-red-500">{error}</div>;
  if (!cart || cart.items.length === 0) {
    return (
      <div className="text-center mt-10">
        <h2 className="text-2xl font-bold">Your cart is empty</h2>
        <button
          onClick={() => window.location.href = '/'}
          className="mt-4 bg-blue-500 text-white px-4 py-2 rounded"
        >
          Continue Shopping
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row p-4 md:p-8 bg-gray-100 min-h-screen">
      <div className="flex-1 mr-0 md:mr-6">
        <h1 className="text-3xl font-bold mb-6">Your Cart</h1>
        {cart.items.map((item) => (
          <CartItem
            key={item.productId._id}
            item={item}
            onUpdateCart={handleUpdateCart}
            cartItems={cart.items}
          />
        ))}
      </div>
      <div className="w-full md:w-1/3 mt-6 md:mt-0">
        <OrderSummary cart={cart} />
      </div>
    </div>
  );
}

export default CartPage;