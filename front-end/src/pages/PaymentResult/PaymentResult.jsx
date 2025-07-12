import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import { resetPayment } from '../../features/payment/paymentSlice';

const PaymentResult = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [countDown, setCountDown] = useState(5);
  
  // Lấy query parameters từ URL
  const query = new URLSearchParams(location.search);
  const status = query.get('status');
  const orderId = query.get('orderId');
  const message = query.get('message');
  
  useEffect(() => {
    // Reset payment state trong Redux
    dispatch(resetPayment());
    
    // Hiển thị toast dựa vào trạng thái
    if (status === 'paid') {
      toast.success('Thanh toán thành công!');
    } else if (status === 'failed') {
      toast.error('Thanh toán thất bại!');
    } else {
      toast.error(message || 'Đã xảy ra lỗi trong quá trình thanh toán.');
    }
    
    // Bắt đầu đếm ngược để chuyển về trang chủ
    const timer = setInterval(() => {
      setCountDown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [status, message, dispatch, navigate]);
  
  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md text-center">
      {status === 'paid' ? (
        <div className="text-green-600">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <h2 className="text-2xl font-bold mt-4">Thanh toán thành công!</h2>
          {orderId && <p className="mt-2">Mã đơn hàng: {orderId}</p>}
        </div>
      ) : (
        <div className="text-red-600">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          <h2 className="text-2xl font-bold mt-4">Thanh toán thất bại!</h2>
          {message && <p className="mt-2">{message}</p>}
        </div>
      )}
      
      <p className="mt-6 text-gray-600">
        Bạn sẽ được chuyển về trang chủ sau <span className="font-bold">{countDown}</span> giây
      </p>
      
      <button
        onClick={() => navigate('/')}
        className="mt-6 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
      >
        Về trang chủ ngay
      </button>
    </div>
  );
};

export default PaymentResult; 