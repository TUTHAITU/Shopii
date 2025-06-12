import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { HiOutlineMenuAlt4 } from "react-icons/hi";
import { FaSearch, FaUser, FaCaretDown, FaShoppingCart } from "react-icons/fa";
import Flex from "../../designLayouts/Flex";
import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { BsSuitHeartFill } from "react-icons/bs";
import CategoryService from "../../../services/api/CategoryService";
import ProductService from "../../../services/api/ProductService";
import AuthenService from "../../../services/api/AuthenService";
import { resetUserInfo, setUserInfo, setProducts, calculateCartTotalCount, calculateWishlistTotalCount } from "../../../redux/orebiSlice";

const HeaderBottom = () => {
  const products = useSelector((state) => state.orebiReducer.products);
  const wishlish = useSelector((state) => state.orebiReducer.wishlish);
  const cartTotalCount = useSelector((state) => state.orebiReducer.cartTotalCount);
  const wistlistTotalCount = useSelector((state) => state.orebiReducer.wistlistTotalCount);
  const [show, setShow] = useState(false);
  const [showUser, setShowUser] = useState(false);
  const navigate = useNavigate();
  const ref = useRef();
  const [categories, setCategories] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [userName, setUserName] = useState(null);
  const dispatch = useDispatch();
  const isLoggedIn = !!localStorage.getItem('accessToken');
  useEffect(() => {
    const fetchCategories = async () => {
      const allCategories = await CategoryService.getAllCategories();
      setCategories(allCategories);
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      const products = await ProductService.getAllProducts();
      dispatch(setProducts(products));
      setAllProducts(products);
    };
    fetchProducts();
    dispatch(calculateCartTotalCount());
    dispatch(calculateWishlistTotalCount());
  }, [dispatch, products, wishlish]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setShow(false);
      }
    };

    document.body.addEventListener("click", handleClickOutside);
    return () => document.body.removeEventListener("click", handleClickOutside);
  }, []);

  useEffect(() => {
    const filtered = allProducts
      .filter((item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .map((item) => ({
        _id: item._id,
        images: item.images, 
        name: item.name,
        price: item.price,
        description: item.description,
        specs:item.specs,
            inStock:item.inStock,
        category:item.category.name,
            brand:item.brand.name
            
      }));
    setFilteredProducts(filtered);
  }, [searchQuery, allProducts]);

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };
  const handleLogout = async () => {
    await AuthenService.logout();
    dispatch(resetUserInfo());
    navigate('/signin');
  };
  useEffect(() => {
    const fetchUserData = async () => {
      const user = await AuthenService.getProfile();
      setUserName(user.user.fullName);
      dispatch(setUserInfo(user.user));
    };

    if (isLoggedIn) {
      fetchUserData();
    }
  }, [isLoggedIn,dispatch]);

  return (
    // <div className="w-full bg-[#F5F5F3] relative">
    <div className="w-full bg-gradient-to-b from-red-500 to-red-300 relative">
      <div className="max-w-container mx-auto">
        <Flex className="flex flex-col lg:flex-row items-start lg:items-center justify-between w-full px-4 pb-4 lg:pb-0 h-full lg:h-24">
          <div
            onClick={() => setShow(!show)}
            ref={ref}
            className="flex h-14 cursor-pointer items-center gap-2 text-primeColor"
          >
            <HiOutlineMenuAlt4 className="w-5 h-5" />
            <p className="text-[14px] font-normal">Shop by Category</p>

            {show && (
              <motion.ul
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="absolute top-36 z-50 bg-primeColor w-auto text-[#767676] h-auto p-4 pb-6"
              >
                {categories.map((item) => (
                  <Link key={item._id} to={`category/${item.name}`}>
                    <li className="text-gray-400 px-4 py-1 border-b-[1px] border-b-gray-400 hover:border-b-white hover:text-white duration-300 cursor-pointer">
                      {item.name}
                    </li>
                  </Link>
                ))}
              </motion.ul>
            )}
          </div>
          <div className="relative w-full lg:w-[600px] h-[50px] text-base text-primeColor bg-white flex items-center gap-2 justify-between px-6 rounded-xl">
            <input
              className="flex-1 h-full outline-none placeholder:text-[#C4C4C4] placeholder:text-[14px]"
              type="text"
              onChange={handleSearch}
              value={searchQuery}
              placeholder="Search your products here"
            />
            <FaSearch className="w-5 h-5" />
            {searchQuery && (
              <div
                className={`w-full mx-auto h-96 bg-white top-16 absolute left-0 z-50 overflow-y-scroll shadow-2xl scrollbar-hide cursor-pointer`}
              >
                {filteredProducts.map((item) => (
                  <div
                    onClick={() => {
                      navigate(
                       `/product/${item._id}`, 
                        {
                          state: { item },
                        }
                      );
                      setSearchQuery("");
                    }}
                    key={item._id}
                    className="max-w-[600px] h-28 bg-gray-100 mb-3 flex items-center gap-3"
                  >
                    <img className="w-24" src={item.images && item.images.length > 0 ? ProductService.getImage(item.images[0].filename) : ''} alt="productImg" />
                    <div className="flex flex-col gap-1">
                      <p className="font-semibold text-lg">{item.name}</p>
                      <p className="text-xs">
                        {item.description.length > 100
                          ? `${item.description.slice(0, 100)}...`
                          : item.description}
                      </p>
                      <p className="text-sm">
                        Price:{" "}
                        <span className="text-primeColor font-semibold">
                          ${item.price}
                        </span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-4 mt-2 lg:mt-0 items-center pr-6 cursor-pointer relative">
            <div onClick={() => setShowUser(!showUser)} className="flex">
              <FaUser />
              <FaCaretDown />
            </div>
            {showUser && (
              <motion.ul
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="absolute top-6 left-0 z-50 bg-primeColor w-44 text-[#767676] h-auto p-4 pb-6"
              >
                  {!isLoggedIn ? (
                      <>
                <Link to="/signin">
                  <li className="text-gray-400 px-4 py-1 border-b-[1px] border-b-gray-400 hover:border-b-white hover:text-white duration-300 cursor-pointer">
                    Login
                  </li>
                </Link>
                <Link onClick={() => setShowUser(false)} to="/signup">
                  <li className="text-gray-400 px-4 py-1 border-b-[1px] border-b-gray-400 hover:border-b-white hover:text-white duration-300 cursor-pointer">
                    Sign Up
                  </li>
                </Link>
                 </>
                ) : (
                  <>
                   <li className="text-white px-4 py-1 cursor-default">
                      {userName}
                    </li>
                    <Link to={`/order-history`}>
                <li className="text-gray-400 px-4 py-1 border-b-[1px] border-b-gray-400 hover:border-b-white hover:text-white duration-300 cursor-pointer">
                  History Order
                </li>
                </Link>
                <Link to={`/profile`}>
                <li className="text-gray-400 px-4 py-1 border-b-[1px] border-b-gray-400 hover:border-b-white hover:text-white duration-300 cursor-pointer">
                  Profile
                </li>
                </Link>
                <li
                  onClick={handleLogout}
                  className="text-gray-400 px-4 py-1 border-b-[1px] border-b-gray-400 hover:border-b-white hover:text-white duration-300 cursor-pointer"
                >
                  Logout
                </li>
                </>
                )}
              </motion.ul>
            )}
            <Link to="/cart">
              <div className="relative">
                <FaShoppingCart />
                <span className="absolute font-titleFont top-3 -right-2 text-xs w-4 h-4 flex items-center justify-center rounded-full bg-primeColor text-white">
                  {cartTotalCount ? cartTotalCount : 0}
                </span>
              </div>
            </Link>
            <Link to="/wishlist">
              <div className="relative">
                <BsSuitHeartFill />
                <span className="absolute font-titleFont top-3 -right-2 text-xs w-4 h-4 flex items-center justify-center rounded-full bg-primeColor text-white">
                  {wistlistTotalCount ? wistlistTotalCount : 0}
                </span>
              </div>
            </Link>

          </div>
        </Flex>
      </div>
    </div>
  );
};

export default HeaderBottom;
