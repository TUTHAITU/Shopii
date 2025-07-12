// Payment.jsx (cập nhật)
import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { createPayment, resetPayment } from "../../features/payment/paymentSlice"; // Giả sử đường dẫn đúng
import axios from "axios";

const Payment = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const payosIframeRef = useRef(null);

  const { orderId, totalPrice, paymentMethod: initialPaymentMethod } = location.state || {
    orderId: null,
    totalPrice: 0,
    initialPaymentMethod: 'COD'
  };

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(initialPaymentMethod || 'COD');
  const [showPayosIframe, setShowPayosIframe] = useState(false);
  const [paymentPolling, setPaymentPolling] = useState(false);

  const { payment, loading, error, success } = useSelector((state) => state.payment);
  const { token } = useSelector((state) => state.auth);

  // Polling cho trạng thái thanh toán VietQR
  useEffect(() => {
    let pollingInterval;
    
    if (success && selectedPaymentMethod === 'VietQR' && paymentPolling) {
      pollingInterval = setInterval(async () => {
        try {
          // Kiểm tra trạng thái thanh toán
          const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:9999/api';
          const response = await axios.get(`${API_URL}/buyers/payments/status/${orderId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          const paymentStatus = response.data.payment.status;
          if (paymentStatus === 'paid') {
            clearInterval(pollingInterval);
            toast.success("Thanh toán thành công!");
            navigate('/payment-result', { 
              state: { status: 'paid', orderId: orderId },
              replace: true 
            });
          } else if (paymentStatus === 'failed') {
            clearInterval(pollingInterval);
            toast.error("Thanh toán thất bại!");
            navigate('/payment-result', { 
              state: { status: 'failed', orderId: orderId },
              replace: true 
            });
          }
        } catch (err) {
          console.error("Lỗi khi kiểm tra trạng thái thanh toán:", err);
        }
      }, 5000); // Kiểm tra mỗi 5 giây
    }
    
    return () => {
      if (pollingInterval) clearInterval(pollingInterval);
    };
  }, [success, selectedPaymentMethod, paymentPolling, orderId, token, navigate]);

  useEffect(() => {
    if (success) {
      if (selectedPaymentMethod === 'VietQR') {
        toast.success("Mã QR đã được tạo. Vui lòng quét để thanh toán.");
        setPaymentPolling(true); // Bắt đầu polling khi QR được tạo
      } else if (selectedPaymentMethod === 'PayOS') {
        if (payment?.paymentUrl) {
          setShowPayosIframe(true);
          toast.success("Đã mở cổng thanh toán PayOS");
        } else {
          toast.error("Không thể tạo liên kết thanh toán PayOS");
          dispatch(resetPayment());
        }
      } else if (selectedPaymentMethod === 'COD') {
        toast.success("Đã tạo đơn hàng COD thành công.");
        setTimeout(() => {
          navigate('/payment-result', { 
            state: { status: 'paid', orderId: orderId },
            replace: true 
          });
        }, 2000);
      }
    }

    if (error) {
      toast.error(error);
      dispatch(resetPayment());
    }
  }, [success, error, payment, selectedPaymentMethod, dispatch, orderId, navigate]);

  if (!orderId) {
    toast.error("Không tìm thấy thông tin đơn hàng.");
    navigate("/");
    return null;
  }

  const handlePayment = () => {
    dispatch(createPayment({ orderId, method: selectedPaymentMethod }));
  };

  const handleBackToHome = () => {
    setShowPayosIframe(false);
    setPaymentPolling(false);
    dispatch(resetPayment());
    navigate("/");
  };

  // Hàm mở trang thanh toán PayOS trong tab mới
  const openPaymentPage = () => {
    if (payment?.paymentUrl) {
      window.open(payment.paymentUrl, '_blank');
    }
  };

  return (
    <div className="max-w-container mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-8">Thanh toán đơn hàng</h1>
      
      {showPayosIframe && payment?.paymentUrl ? (
        <div className="bg-white p-6 rounded-lg shadow-md mx-auto max-w-4xl">
          <h2 className="text-xl font-semibold mb-4">Thanh toán qua PayOS</h2>
          <div className="relative" style={{height: "600px"}}>
            <iframe 
              ref={payosIframeRef}
              src={payment.paymentUrl}
              style={{
                width: "100%",
                height: "100%",
                border: "none",
                borderRadius: "8px"
              }}
              title="PayOS Payment"
              allow="payment"
            ></iframe>
          </div>
          <div className="mt-4 flex justify-between">
            <button
              onClick={openPaymentPage}
              className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors"
            >
              Mở trong tab mới
            </button>
            <button
              onClick={handleBackToHome}
              className="bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600 transition-colors"
            >
              Trở về trang chủ
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-lg shadow-md max-w-md mx-auto">
          <h2 className="text-xl font-semibold mb-4">Tóm tắt thanh toán</h2>
          
          <div className="mb-6">
            <p className="flex justify-between mb-2">
              <span>Mã đơn hàng:</span>
              <span>{orderId}</span>
            </p>
            <p className="flex justify-between font-bold text-lg">
              <span>Tổng tiền:</span>
              <span>${totalPrice.toFixed(2)}</span>
            </p>
          </div>
          
          <h3 className="font-medium mb-3">Chọn phương thức thanh toán</h3>
          <div className="space-y-3 mb-6">
            <div className="flex items-center">
              <input
                type="radio"
                id="COD"
                name="paymentMethod"
                value="COD"
                checked={selectedPaymentMethod === 'COD'}
                onChange={() => setSelectedPaymentMethod('COD')}
                className="mr-3"
              />
              <label htmlFor="COD">Thanh toán khi nhận hàng (COD)</label>
            </div>
            <div className="flex items-center">
              <input
                type="radio"
                id="VietQR"
                name="paymentMethod"
                value="VietQR"
                checked={selectedPaymentMethod === 'VietQR'}
                onChange={() => setSelectedPaymentMethod('VietQR')}
                className="mr-3"
              />
              <label htmlFor="VietQR">Thanh toán qua VietQR</label>
            </div>
            <div className="flex items-center">
              <input
                type="radio"
                id="PayOS"
                name="paymentMethod"
                value="PayOS"
                checked={selectedPaymentMethod === 'PayOS'}
                onChange={() => setSelectedPaymentMethod('PayOS')}
                className="mr-3"
              />
              <label htmlFor="PayOS">Thanh toán qua PayOS</label>
            </div>
          </div>
          
          <button
            onClick={handlePayment}
            disabled={loading || success} // Disable nút nếu đã success để tránh gọi lại
            className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition-colors mb-4"
          >
            {loading ? 'Đang xử lý...' : 'Thanh toán'}
          </button>

          {success && selectedPaymentMethod === 'VietQR' && payment?.qrData?.qrDataURL && (
            <div className="mb-4 text-center">
              <h3 className="font-medium mb-2">Quét mã QR để thanh toán</h3>
              <img src={payment.qrData.qrDataURL} alt="VietQR Code" className="mx-auto" />
              {paymentPolling && (
                <p className="mt-2 text-sm text-gray-600">
                  Đang chờ xác nhận thanh toán...
                </p>
              )}
            </div>
          )}

          {success && (
            <button
              onClick={handleBackToHome}
              className="w-full bg-gray-500 text-white py-3 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Trở về trang chủ
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default Payment;