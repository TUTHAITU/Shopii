import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    
    // Mock login - replace with actual API call
    if (formData.email === 'user@example.com' && formData.password === 'password') {
      // Save user to localStorage
      localStorage.setItem('user', JSON.stringify({
        id: '123',
        name: 'Nguyễn Văn A',
        role: 'buyer'
      }));
      navigate('/');
    } else {
      setError('Email hoặc mật khẩu không chính xác');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="container max-w-md mx-auto flex-1 flex flex-col items-center justify-center px-2">
        <div className="bg-white px-6 py-8 rounded shadow-md w-full">
          <h1 className="mb-8 text-3xl text-center font-bold text-indigo-600">Đăng nhập</h1>
          
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <input 
              type="email"
              className="block border border-gray-300 w-full p-3 rounded mb-4"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              required
            />
            
            <input 
              type="password"
              className="block border border-gray-300 w-full p-3 rounded mb-4"
              name="password"
              placeholder="Mật khẩu"
              value={formData.password}
              onChange={handleChange}
              required
            />
            
            <button
              type="submit"
              className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 focus:outline-none my-1"
            >
              Đăng nhập
            </button>
          </form>
          
          <div className="text-center mt-4">
            <Link to="/forgot-password" className="text-indigo-600 hover:underline">
              Quên mật khẩu?
            </Link>
          </div>
        </div>
        
        <div className="text-gray-600 mt-6">
          Bạn chưa có tài khoản? 
          <Link to="/register" className="ml-1 text-indigo-600 hover:underline">
            Đăng ký ngay
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;