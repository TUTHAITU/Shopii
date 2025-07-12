import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Breadcrumbs from "../../components/pageProps/Breadcrumbs";
import { emptyCart } from "../../assets/images/index";
import ItemCard from "./ItemCard";
import { toast } from "react-toastify";
import { 
  fetchCart,
  updateCartItem,
  removeCartItem,
  resetCart,
  removeSelectedItems
} from "../../features/cart/cartSlice";

const Cart = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const { token } = useSelector((state) => state.auth) || {};
  const { items: cartItems, loading, error } = useSelector((state) => state.cart);
  
  const [totalAmt, setTotalAmt] = React.useState(0);
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  // Fetch cart on mount and when token changes
  useEffect(() => {
    if (token) {
      dispatch(fetchCart());
    } else {
      navigate('/signin');
      toast.info('Please login to view your cart');
    }
  }, [dispatch, token, navigate]);

  // Calculate total amount for selected items
  useEffect(() => {
    let price = 0;
    cartItems.forEach((item) => {
      if (selectedItems.includes(item.productId._id)) {
        if (item.productId && item.productId.price) {
          price += item.productId.price * item.quantity;
        }
      }
    });
    setTotalAmt(price);
  }, [cartItems, selectedItems]);

  // Handle select/deselect all
  useEffect(() => {
    if (selectAll && cartItems.length > 0) {
      const allItemIds = cartItems.map(item => item.productId._id);
      setSelectedItems(allItemIds);
    } else if (!selectAll) {
      setSelectedItems([]);
    }
  }, [selectAll, cartItems]);

  // Handle reset cart
  const handleResetCart = () => {
    if (window.confirm('Are you sure you want to reset your cart?')) {
      dispatch(resetCart());
      setSelectedItems([]);
      setSelectAll(false);
    }
  };

  // Handle remove selected items
  const handleRemoveSelected = () => {
    if (selectedItems.length === 0) {
      toast.warn('No items selected');
      return;
    }
    
    dispatch(removeSelectedItems(selectedItems));
    setSelectedItems([]);
    setSelectAll(false);
  };

  // Handle update quantity
  const handleUpdateQuantity = (productId, quantity) => {
    dispatch(updateCartItem({ productId, quantity }));
  };

  // Handle remove item
  const handleRemoveItem = (productId) => {
    dispatch(removeCartItem(productId));
    setSelectedItems(prev => prev.filter(id => id !== productId));
  };

  // Toggle item selection
  const toggleItemSelection = (itemId) => {
    setSelectedItems(prev => {
      if (prev.includes(itemId)) {
        return prev.filter(id => id !== itemId);
      } else {
        return [...prev, itemId];
      }
    });
  };

  if (loading) {
    return (
      <div className="max-w-container mx-auto px-4">
        <Breadcrumbs title="Cart" />
        <div className="flex justify-center items-center h-64">
          <p className="text-lg">Loading cart...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-container mx-auto px-4">
        <Breadcrumbs title="Cart" />
        <div className="flex justify-center items-center h-64">
          <p className="text-lg text-red-500">Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-container mx-auto px-4">
      <Breadcrumbs title="Cart" />
      {cartItems.length > 0 ? (
        <div className="pb-20">
          <div className="w-full h-20 bg-[#F5F7F7] text-primeColor hidden lgl:grid grid-cols-6 place-content-center px-6 text-lg font-titleFont font-semibold">
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={selectAll}
                onChange={() => setSelectAll(!selectAll)}
                className="mr-2 h-4 w-4"
              />
              <span>Select All</span>
            </div>
            <h2 className="col-span-2">Product</h2>
            <h2>Price</h2>
            <h2>Quantity</h2>
            <h2>Sub Total</h2>
          </div>
          <div className="mt-5">
            {cartItems.map((item) => (
              <div key={item.productId?._id || Math.random()}>
                <ItemCard 
                  item={{ 
                    ...item.productId, 
                    quantity: item.quantity,
                    _id: item.productId?._id 
                  }} 
                  isSelected={selectedItems.includes(item.productId._id)}
                  onSelect={() => toggleItemSelection(item.productId._id)}
                  onUpdateQuantity={handleUpdateQuantity}
                  onRemoveItem={handleRemoveItem}
                />
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-4 my-4">
            <button
              onClick={handleResetCart}
              className="py-2 px-6 bg-red-500 text-white font-semibold uppercase hover:bg-red-700 duration-300"
            >
              Reset cart
            </button>
            
            <button
              onClick={handleRemoveSelected}
              className="py-2 px-6 bg-red-500 text-white font-semibold uppercase hover:bg-red-700 duration-300"
              disabled={selectedItems.length === 0}
            >
              Remove Selected ({selectedItems.length})
            </button>
          </div>


          
          <div className="max-w-7xl gap-4 flex justify-end mt-4">
            <div className="w-96 flex flex-col gap-4">
              {/* ... */}
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    if (selectedItems.length === 0) {
                      toast.error("Bạn phải chọn sản phẩm muốn đặt hàng");
                    } else {
                      navigate("/checkout", { state: { selectedItems } });
                    }
                  }}
                  className="w-52 h-10 bg-primeColor text-white hover:bg-black duration-300"
                >
                  Proceed to Checkout
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col mdl:flex-row justify-center items-center gap-4 pb-20"
        >
          <div>
            <img
              className="w-80 rounded-lg p-4 mx-auto"
              src={emptyCart}
              alt="emptyCart"
            />
          </div>
          <div className="max-w-[500px] p-4 py-8 bg-white flex gap-4 flex-col items-center rounded-md shadow-lg">
            <h1 className="font-titleFont text-xl font-bold uppercase">
              Your Cart feels lonely.
            </h1>
            <p className="text-sm text-center px-10 -mt-2">
              Your Shopping cart lives to serve. Give it purpose - fill it with
              books, electronics, videos, etc. and make it happy.
            </p>
            <Link to="/shop">
              <button className="bg-primeColor rounded-md cursor-pointer hover:bg-black active:bg-gray-900 px-8 py-2 font-titleFont font-semibold text-lg text-gray-200 hover:text-white duration-300">
                Continue Shopping
              </button>
            </Link>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default Cart;