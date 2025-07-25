import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Header = ({ isLoggedIn, user, onLogout }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    console.log('Searching for:', searchTerm);
    // Implement search functionality here
  };

  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center">
          <Link to="/" className="text-xl font-bold text-indigo-600">Marketplace</Link>
        </div>

        <form onSubmit={handleSearch} className="flex-1 mx-10">
          <div className="relative">
            <input
              type="text"
              placeholder="Tìm kiếm sản phẩm..."
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button 
              type="submit"
              className="absolute right-3 top-2 text-gray-500 hover:text-indigo-600"
            >
              🔍
            </button>
          </div>
        </form>

        <div className="flex items-center space-x-4">
          {isLoggedIn ? (
            <div className="relative">
              <button 
                className="flex items-center space-x-2"
                onClick={() => setDropdownOpen(!dropdownOpen)}
              >
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                  <span className="font-medium text-indigo-600">
                    {user.name.charAt(0)}
                  </span>
                </div>
                <span className="font-medium">{user.name}</span>
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                  <Link 
                    to="/profile" 
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50"
                  >
                    Hồ sơ
                  </Link>
                  <Link 
                    to="/orders" 
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50"
                  >
                    Lịch sử đơn hàng
                  </Link>
                  <Link 
                    to="/cart" 
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50"
                  >
                    Giỏ hàng
                  </Link>
                  <button
                    onClick={onLogout}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50"
                  >
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex space-x-2">
              <Link 
                to="/login" 
                className="px-4 py-2 text-indigo-600 font-medium hover:bg-indigo-50 rounded-lg"
              >
                Đăng nhập
              </Link>
              <Link 
                to="/register" 
                className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700"
              >
                Đăng ký
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;