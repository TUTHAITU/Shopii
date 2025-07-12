import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import Modal from "react-modal";
import { fetchAddresses, addAddress } from "../../features/address/addressSlice";
import { applyVoucher, clearVoucher } from "../../features/voucher/voucherSlice";
import { createOrder } from "../../features/order/orderSlice"; // Import createOrder
import { removeSelectedItems } from "../../features/cart/cartSlice"; // Import removeSelectedItems

const Checkout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  // Get data from the Redux store
  const { token } = useSelector((state) => state.auth) || {};
  const cartItems = useSelector((state) => state.cart?.items || []);
  const addresses = useSelector((state) => state.address?.addresses || []);
  const { voucher, loading: voucherLoading, error: voucherError } = useSelector((state) => state.voucher);

  // State for selected products
  const selectedItems = location.state?.selectedItems || [];
  const selectedProducts = cartItems.filter(item =>
    item.productId && selectedItems.includes(item.productId._id)
  );

  // State for checkout options
  const [couponCode, setCouponCode] = useState("");
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [newAddress, setNewAddress] = useState({
    fullName: "",
    phone: "",
    street: "",
    city: "",
    state: "",
    country: "",
    isDefault: false,
  });
  const [phoneError, setPhoneError] = useState("");
  // State for selected payment method
  const [paymentMethod, setPaymentMethod] = useState('COD');

  // Fetch addresses on component mount and clear voucher on unmount
  useEffect(() => {
    if (token) {
      dispatch(fetchAddresses());
    }
    return () => {
      dispatch(clearVoucher());
    };
  }, [dispatch, token]);

  // Validate phone number
  const validatePhoneNumber = (phone) => {
    const regex = /^0\d{9}$/;
    return regex.test(phone);
  };

  // Calculate subtotal
  const subtotal = selectedProducts.reduce((total, item) => {
    return total + (item.productId?.price || 0) * item.quantity;
  }, 0);

  // Calculate discount from the applied voucher
  const calculateDiscount = () => {
    if (!voucher) return 0;
    if (subtotal < voucher.minOrderValue) {
      if (voucherError === null) {
        toast.error(`Đơn hàng phải có giá trị tối thiểu ${voucher.minOrderValue.toLocaleString()}đ để áp dụng mã này.`);
        dispatch(clearVoucher());
      }
      return 0;
    }
    if (voucher.discountType === 'fixed') {
      return voucher.discount;
    } else if (voucher.discountType === 'percentage') {
      const calculatedDiscount = (subtotal * voucher.discount) / 100;
      return voucher.maxDiscount > 0 ? Math.min(calculatedDiscount, voucher.maxDiscount) : calculatedDiscount;
    }
    return 0;
  };

  const discount = calculateDiscount();
  const total = Math.max(subtotal - discount, 0);

  // Handle adding a new address
  const handleAddAddress = () => {
    if (!validatePhoneNumber(newAddress.phone)) {
      setPhoneError("Số điện thoại không hợp lệ. Phải bắt đầu bằng 0 và chứa đúng 10 chữ số.");
      return;
    }
    setPhoneError("");
    dispatch(addAddress(newAddress));
    setIsAddressModalOpen(false);
    setNewAddress({
      fullName: "", phone: "", street: "", city: "", state: "", country: "", isDefault: false,
    });
  };

  // Handle applying the coupon code
  const handleApplyCoupon = () => {
    if (couponCode.trim()) {
      dispatch(applyVoucher(couponCode));
    } else {
      toast.error("Vui lòng nhập mã giảm giá");
    }
  };

  // Handle canceling the applied voucher
  const handleCancelVoucher = () => {
    dispatch(clearVoucher());
    setCouponCode("");
    toast.info("Đã hủy áp dụng mã giảm giá.");
  };

  // Handle placing the order, now including the payment method
  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      toast.error("Vui lòng chọn địa chỉ giao hàng");
      return;
    }
    
    const orderDetails = { 
      selectedItems: selectedProducts.map(item => ({
        productId: item.productId._id,
        quantity: item.quantity
      })), 
      selectedAddressId, 
      couponCode: voucher ? voucher.code : '',
      paymentMethod
    };

    try {
      const result = await dispatch(createOrder(orderDetails)).unwrap();
      
      // Xóa các sản phẩm đã chọn khỏi giỏ hàng
      const productIds = selectedProducts.map(item => item.productId._id);
      await dispatch(removeSelectedItems(productIds)).unwrap();
      
      toast.success("Đặt hàng thành công!");
      
      // Chuyển sang trang thanh toán (giả sử route /payment đã được thêm trong App.js)
      navigate("/payment", { 
        state: { 
          orderId: result.orderId, 
          totalPrice: result.totalPrice, 
          paymentMethod 
        } 
      });
    } catch (error) {
      toast.error(error);
    }
  };

  return (
    <div className="max-w-container mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-8">Thanh toán</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left side: Shipping, coupon, and payment method */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-6">Thông tin giao hàng & Thanh toán</h2>
          
          {/* Address selection */}
          <div className="mb-6 border-b pb-6">
            <h3 className="font-medium mb-3">Chọn địa chỉ giao hàng</h3>
            {addresses.length > 0 ? (
              <div className="space-y-3">
                {addresses.map((address) => (
                  <div key={address._id} className="flex items-center">
                    <input type="radio" id={address._id} name="address" checked={selectedAddressId === address._id} onChange={() => setSelectedAddressId(address._id)} className="mr-3"/>
                    <label htmlFor={address._id}>
                      {`${address.fullName}, ${address.phone}, ${address.street}, ${address.city}, ${address.state}`}
                      {address.isDefault && <span className="text-green-500 ml-2">(Mặc định)</span>}
                    </label>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">Bạn chưa có địa chỉ. Vui lòng thêm địa chỉ mới.</p>
            )}
            <button className="mt-3 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600" onClick={() => setIsAddressModalOpen(true)}>
              Thêm địa chỉ mới
            </button>
          </div>
          
          {/* Coupon code input */}
          <div className="mb-6 border-b pb-6">
            <h3 className="font-medium mb-3">Mã giảm giá</h3>
            {voucher ? (
              <div className="flex items-center justify-between">
                <p className="text-green-600 font-semibold">
                  ✓ Đã áp dụng mã: {voucher.code}
                </p>
                <button 
                  onClick={handleCancelVoucher}
                  className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition-colors text-sm"
                >
                  Hủy
                </button>
              </div>
            ) : (
              <>
                <div className="flex">
                  <input type="text" placeholder="Nhập mã giảm giá" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} className="flex-grow border rounded-l p-2 border-r-0"/>
                  <button className="bg-gray-200 px-4 py-2 rounded-r hover:bg-gray-300 transition-colors" onClick={handleApplyCoupon} disabled={voucherLoading}>
                    {voucherLoading ? 'Đang áp dụng...' : 'Áp dụng'}
                  </button>
                </div>
                {voucherError && !voucher &&(
                  <p className="text-red-500 mt-2">{voucherError}</p>
                )}
              </>
            )}
          </div>
          
         
        </div>
        
        {/* Right side: Order summary */}
        <div className="bg-white p-6 rounded-lg shadow-md h-fit">
          <h2 className="text-xl font-semibold mb-6">Tóm tắt đơn hàng</h2>
          
          <div className="border-b pb-4 mb-4">
            <h3 className="font-medium mb-3">Sản phẩm ({selectedProducts.length})</h3>
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {selectedProducts.map(item => (
                <div key={item.productId?._id} className="flex items-center border-b pb-3">
                  <img src={item.productId?.image} alt={item.productId?.title} className="w-16 h-16 object-cover rounded mr-4"/>
                  <div className="flex-grow">
                    <p className="font-medium">{item.productId?.title}</p>
                    <p>Số lượng: {item.quantity}</p>
                  </div>
                  <p className="font-medium">${((item.productId?.price || 0) * item.quantity).toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>
          
          <div className="space-y-2 mb-6">
            <div className="flex justify-between"><span>Tạm tính:</span><span>${subtotal.toFixed(2)}</span></div>
            {discount > 0 && (
              <div className="flex justify-between text-green-600"><span>Giảm giá:</span><span>-${discount.toFixed(2)}</span></div>
            )}
            <div className="flex justify-between font-bold text-lg pt-2 border-t"><span>Tổng cộng:</span><span>${total.toFixed(2)}</span></div>
          </div>
          
          <button onClick={handlePlaceOrder} className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition-colors">
            Đặt hàng
          </button>
        </div>
      </div>
      
      {/* Add new address modal */}
      <Modal isOpen={isAddressModalOpen} onRequestClose={() => setIsAddressModalOpen(false)} className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center">
        <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
          <h2 className="text-xl font-bold mb-4">Thêm địa chỉ mới</h2>
          {phoneError && <p className="text-red-500 mb-4">{phoneError}</p>}
          <div className="space-y-4">
            <input type="text" placeholder="Họ và tên" value={newAddress.fullName} onChange={(e) => setNewAddress({ ...newAddress, fullName: e.target.value })} className="w-full p-2 border rounded"/>
            <input type="text" placeholder="Số điện thoại" value={newAddress.phone} onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })} className="w-full p-2 border rounded"/>
            <input type="text" placeholder="Địa chỉ" value={newAddress.street} onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })} className="w-full p-2 border rounded"/>
            <input type="text" placeholder="Thành phố" value={newAddress.city} onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })} className="w-full p-2 border rounded"/>
            <input type="text" placeholder="Tỉnh/Thành" value={newAddress.state} onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })} className="w-full p-2 border rounded"/>
            <input type="text" placeholder="Quốc gia" value={newAddress.country} onChange={(e) => setNewAddress({ ...newAddress, country: e.target.value })} className="w-full p-2 border rounded"/>
            <label className="flex items-center space-x-2">
              <input type="checkbox" checked={newAddress.isDefault} onChange={(e) => setNewAddress({ ...newAddress, isDefault: e.target.checked })}/>
              <span>Đặt làm địa chỉ mặc định</span>
            </label>
            <div className="flex space-x-2">
              <button onClick={handleAddAddress} className="bg-blue-500 text-white px-4 py-2 rounded">Lưu</button>
              <button onClick={() => setIsAddressModalOpen(false)} className="bg-gray-500 text-white px-4 py-2 rounded">Hủy</button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Checkout;