import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { forgotPassword } from '../services/authService';
import { toast } from 'react-toastify';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await forgotPassword({ email });
      toast.success('Yêu cầu khôi phục mật khẩu đã được gửi. Vui lòng kiểm tra email của bạn.');
    } catch (error) {
      toast.error(error.message || 'Có lỗi xảy ra khi gửi yêu cầu khôi phục mật khẩu.');
    }
  };

  const handleBackToLogin = () => {
    navigate('/signin');
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Quên mật khẩu</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="email" className="block text-gray-700 mb-2">
              Nhập email của bạn
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border rounded w-full px-4 py-2"
              placeholder="Email"
              required
            />
          </div>
          <button
            type="submit"
            className="bg-blue-500 text-white rounded px-4 py-2 w-full mb-4"
          >
            Gửi yêu cầu
          </button>
        </form>
        <button
          onClick={handleBackToLogin}
          className="text-blue-500 hover:underline"
        >
          Quay lại trang đăng nhập
        </button>
      </div>
    </div>
  );
};

export default ForgotPassword;