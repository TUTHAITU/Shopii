import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { FaSearch, FaUser, FaCaretDown, FaShoppingCart } from "react-icons/fa";
import Flex from "../../designLayouts/Flex";
import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import axios from "axios";
import {
  resetUserInfo,
  setUserInfo,
  setProducts,
  calculateCartTotalCount,
} from "../../../redux/orebiSlice";

const HeaderBottom = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const ref = useRef();

    // Lấy thông tin xác thực từ Redux store
  const authState = useSelector(state => state.auth);
  const isAuthenticated = authState?.isAuthenticated || false;
  const user = authState?.user || null;

  // Lấy dữ liệu từ Redux store với kiểm tra an toàn
  const orebiReducer = useSelector((state) => state.orebiReducer) || {};
  const products = orebiReducer.products || [];
  
  // Thêm: Lấy thông tin giỏ hàng từ Redux store
  const cartState = useSelector((state) => state.cart) || {};
  const cartItems = cartState.items || [];
  
  // Tính toán tổng số lượng sản phẩm trong giỏ hàng
  const cartTotalCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  const [showUser, setShowUser] = useState(false);
  const [allProducts, setAllProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [userName, setUserName] = useState(null);
  
  const isLoggedIn = !!localStorage.getItem('accessToken');
  const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:9999";

  // Hàm fetch products
  const fetchProducts = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/products`);
      // Cập nhật để phù hợp với model backend
      const formattedProducts = response.data.map(product => ({
        ...product,
        name: product.title,
        image: product.image
      }));
      
      dispatch(setProducts(formattedProducts));
      setAllProducts(formattedProducts);
    } catch (error) {
      console.error("Failed to fetch products:", error);
    }
  }, [API_BASE_URL, dispatch]);

  // Hàm fetch user data
  const fetchUserData = useCallback(async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_BASE_URL}/api/profile`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setUserName(response.data.fullname || response.data.username);
      dispatch(setUserInfo(response.data));
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
    }
  }, [API_BASE_URL, dispatch]);

  // Effect để load dữ liệu khi component mount
  useEffect(() => {
    fetchProducts();
    
    if (isLoggedIn) {
      fetchUserData();
    }
  }, [isLoggedIn, fetchProducts, fetchUserData, dispatch]);

  // Effect để xử lý click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setShowUser(false);
      }
    };

    document.body.addEventListener("click", handleClickOutside);
    return () => document.body.removeEventListener("click", handleClickOutside);
  }, []);

  // Effect để filter products khi search query thay đổi
  useEffect(() => {
    const filtered = allProducts
      .filter((item) => 
        item.title && item.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .map((item) => ({
        _id: item._id,
        image: item.image,
        name: item.title,
        price: item.price,
        description: item.description,
        category: item.categoryId?.name || "",
        seller: item.sellerId?.username || ""
      }));
    
    setFilteredProducts(filtered);
  }, [searchQuery, allProducts]);

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      await axios.post(`${API_BASE_URL}/api/logout`, null, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      localStorage.removeItem('accessToken');
      dispatch(resetUserInfo());
      navigate('/signin');
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const getProductImage = (item) => {
    if (item.image) {
      return `${API_BASE_URL}/images/${item.image}`;
    }
    return "https://via.placeholder.com/100";
  };

  return (
    <div className="w-full bg-gradient-to-b from-red-500 to-red-300 relative">
      <div className="max-w-container mx-auto">
        <Flex className="flex flex-col lg:flex-row items-start lg:items-center justify-between w-full px-4 pb-4 lg:pb-0 h-full lg:h-24">
          {/* Logo hoặc phần trống thay thế cho Shop by Category */}
          <div className="flex h-14 items-center gap-2">
            <Link to="/">
              <p className="text-[20px] font-bold text-white">OREBISHOP</p>
            </Link>
          </div>

          {/* Search Bar */}
          <div className="relative w-full lg:w-[600px] h-[50px] text-base text-primeColor bg-white flex items-center gap-2 justify-between px-6 rounded-xl">
            <input
              className="flex-1 h-full outline-none placeholder:text-[#C4C4C4] placeholder:text-[14px]"
              type="text"
              onChange={handleSearch}
              value={searchQuery}
              placeholder="Search your products here"
            />
            <FaSearch className="w-5 h-5" />
            
            {searchQuery && filteredProducts.length > 0 && (
              <div className="w-full mx-auto max-h-96 bg-white top-16 absolute left-0 z-50 overflow-y-auto shadow-2xl scrollbar-thin scrollbar-thumb-gray-300 cursor-pointer">
                {filteredProducts.map((item) => (
                  <div
                    onClick={() => {
                      navigate(`/product/${item._id}`, { state: { item } });
                      setSearchQuery("");
                    }}
                    key={item._id}
                    className="max-w-[600px] h-28 bg-gray-100 mb-3 flex items-center gap-3 p-2 hover:bg-gray-200 transition-colors"
                  >
                    <img 
                      className="w-24 h-24 object-contain" 
                      src={getProductImage(item)} 
                      alt={item.name} 
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "https://via.placeholder.com/100";
                      }}
                    />
                    <div className="flex flex-col gap-1 flex-1">
                      <p className="font-semibold text-lg truncate">{item.name}</p>
                      <p className="text-xs text-gray-600 truncate">
                        {item.description?.length > 100
                          ? `${item.description.slice(0, 100)}...`
                          : item.description}
                      </p>
                      <p className="text-sm">
                        Price:{" "}
                        <span className="text-primeColor font-semibold">
                          ${item.price?.toFixed(2) || "0.00"}
                        </span>
                      </p>
                      {item.category && (
                        <p className="text-xs text-gray-500">
                          Category: {item.category}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* User Actions */}
          <div className="flex gap-4 mt-2 lg:mt-0 items-center pr-6 cursor-pointer relative">
            <div 
              onClick={() => setShowUser(!showUser)} 
              className="flex items-center gap-1"
            >
              <FaUser />
              <FaCaretDown />
            </div>
            
            {showUser && (
              <motion.ul
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="absolute top-6 right-0 z-50 bg-primeColor w-44 text-[#767676] h-auto p-4 pb-6 rounded shadow-lg"
              >
                {isAuthenticated ? (
                  // Đã đăng nhập: Hiển thị menu tài khoản
                  <>
                    {userName && (
                      <li className="text-white px-4 py-1 cursor-default truncate">
                        Hi, {userName}
                      </li>
                    )}
                    <Link to="/order-history" onClick={() => setShowUser(false)}>
                      <li className="text-gray-400 px-4 py-1 border-b-[1px] border-b-gray-400 hover:border-b-white hover:text-white duration-300 cursor-pointer">
                        Order History
                      </li>
                    </Link>
                    <Link to="/profile" onClick={() => setShowUser(false)}>
                      <li className="text-gray-400 px-4 py-1 border-b-[1px] border-b-gray-400 hover:border-b-white hover:text-white duration-300 cursor-pointer">
                        Profile
                      </li>
                    </Link>
                     <Link to="/address" onClick={() => setShowUser(false)}>
                      <li className="text-gray-400 px-4 py-1 border-b-[1px] border-b-gray-400 hover:border-b-white hover:text-white duration-300 cursor-pointer">
                        Addresses
                      </li>
                    </Link>
                    <li
                      onClick={() => {
                        handleLogout();
                        setShowUser(false);
                      }}
                      className="text-gray-400 px-4 py-1 hover:border-b-white hover:text-white duration-300 cursor-pointer"
                    >
                      Logout
                    </li>
                  </>
                ) : (
                  // Chưa đăng nhập: Hiển thị Sign In và Sign Up
                  <>
                    <Link to="/signin" onClick={() => setShowUser(false)}>
                      <li className="text-gray-400 px-4 py-1 border-b-[1px] border-b-gray-400 hover:border-b-white hover:text-white duration-300 cursor-pointer">
                        Sign In
                      </li>
                    </Link>
                    <Link to="/signup" onClick={() => setShowUser(false)}>
                      <li className="text-gray-400 px-4 py-1 border-b-[1px] border-b-gray-400 hover:border-b-white hover:text-white duration-300 cursor-pointer">
                        Sign Up
                      </li>
                    </Link>
                  </>
                )}
              </motion.ul>
            )}
            
            <Link to="/cart" className="relative">
              <FaShoppingCart className="text-lg" />
              {/* Hiển thị số lượng sản phẩm trong giỏ hàng */}
              {cartTotalCount > 0 && (
                <span className="absolute -top-2 -right-2 text-xs w-5 h-5 flex items-center justify-center rounded-full bg-primeColor text-white">
                  {cartTotalCount}
                </span>
              )}
            </Link>
          </div>
        </Flex>
      </div>
    </div>
  );
};

export default HeaderBottom;