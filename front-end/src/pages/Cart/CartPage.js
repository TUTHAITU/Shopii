import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

const CartPage = () => {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalAmt, setTotalAmt] = useState(0);
  const [shippingCharge, setShippingCharge] = useState(0);

  // Dữ liệu người dùng giả lập cho mục đích thử nghiệm
  const testUser = {
    id: "67fe591581ab555c417197c1", // Thay bằng ID người dùng hợp lệ để thử nghiệm
    role: "buyer", // Có thể thay bằng "seller" hoặc "admin" nếu cần
  };

  // Lấy dữ liệu giỏ hàng khi component được mount với tham số skipAuth
  useEffect(() => {
    const fetchCart = async () => {
      try {
        const response = await axios.get(
          `/api/buyers/cart?skipAuth=true&role=${testUser.role}&id=${testUser.id}`
        );
        setCart(response.data);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || "Không tải được giỏ hàng");
        setLoading(false);
      }
    };
    fetchCart();
  }, []);

  // Tính tổng tiền và phí vận chuyển khi giỏ hàng thay đổi
  useEffect(() => {
    if (cart && cart.items.length > 0) {
      const price = cart.items.reduce(
        (acc, item) => acc + item.productId.price * item.quantity,
        0
      );
      setTotalAmt(price);
      setShippingCharge(price <= 200 ? 30 : price <= 400 ? 25 : 20);
    }
  }, [cart]);

  // Tăng số lượng sản phẩm với tham số skipAuth
  const increaseQuantity = async (productId) => {
    const item = cart.items.find((i) => i.productId._id === productId);
    const newQuantity = item.quantity + 1;
    try {
      await axios.put(
        `/api/buyers/cart/update/${productId}?skipAuth=true&role=${testUser.role}&id=${testUser.id}`,
        { quantity: newQuantity }
      );
      setCart((prev) => ({
        ...prev,
        items: prev.items.map((i) =>
          i.productId._id === productId ? { ...i, quantity: newQuantity } : i
        ),
      }));
    } catch (err) {
      setError("Không cập nhật được số lượng");
    }
  };

  // Giảm số lượng sản phẩm với tham số skipAuth
  const decreaseQuantity = async (productId) => {
    const item = cart.items.find((i) => i.productId._id === productId);
    if (item.quantity <= 1) return;
    const newQuantity = item.quantity - 1;
    try {
      await axios.put(
        `/api/buyers/cart/update/${productId}?skipAuth=true&role=${testUser.role}&id=${testUser.id}`,
        { quantity: newQuantity }
      );
      setCart((prev) => ({
        ...prev,
        items: prev.items.map((i) =>
          i.productId._id === productId ? { ...i, quantity: newQuantity } : i
        ),
      }));
    } catch (err) {
      setError("Không cập nhật được số lượng");
    }
  };

  // Xóa sản phẩm khỏi giỏ hàng với tham số skipAuth
  const removeItem = async (productId) => {
    try {
      await axios.delete(
        `/api/buyers/cart/remove/${productId}?skipAuth=true&role=${testUser.role}&id=${testUser.id}`
      );
      setCart((prev) => ({
        ...prev,
        items: prev.items.filter((i) => i.productId._id !== productId),
      }));
    } catch (err) {
      setError("Không xóa được sản phẩm");
    }
  };

  if (loading) return <div className="text-center py-10">Đang tải...</div>;
  if (error) return <div className="text-center py-10 text-red-500">{error}</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Giỏ hàng của bạn</h1>
      {cart && cart.items.length > 0 ? (
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Danh sách sản phẩm trong giỏ hàng */}
          <div className="flex-1">
            {cart.items.map((item) => (
              <div
                key={item.productId._id}
                className="flex items-center border-b py-4"
              >
                <img
                  src={item.productId.image}
                  alt={item.productId.title}
                  className="w-24 h-24 object-cover mr-4"
                />
                <div className="flex-1">
                  <h2 className="text-lg font-semibold">{item.productId.title}</h2>
                  <p className="text-gray-600">${item.productId.price}</p>
                  <div className="flex items-center mt-2">
                    <button
                      onClick={() => decreaseQuantity(item.productId._id)}
                      className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center"
                    >
                      -
                    </button>
                    <span className="mx-4">{item.quantity}</span>
                    <button
                      onClick={() => increaseQuantity(item.productId._id)}
                      className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center"
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">
                    ${(item.productId.price * item.quantity).toFixed(2)}
                  </p>
                  <button
                    onClick={() => removeItem(item.productId._id)}
                    className="text-red-500 hover:underline mt-2"
                  >
                    Xóa
                  </button>
                </div>
              </div>
            ))}
          </div>
          {/* Tóm tắt giỏ hàng */}
          <div className="lg:w-1/3 bg-gray-100 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Tổng giỏ hàng</h2>
            <div className="flex justify-between mb-2">
              <span>Tạm tính</span>
              <span>${totalAmt.toFixed(2)}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span>Phí vận chuyển</span>
              <span>${shippingCharge.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg border-t pt-2">
              <span>Tổng cộng</span>
              <span>${(totalAmt + shippingCharge).toFixed(2)}</span>
            </div>
            <Link
              to="/paymentgateway"
              className="block mt-4 w-full bg-blue-600 text-white text-center py-2 rounded hover:bg-blue-700"
            >
              Thanh toán
            </Link>
          </div>
        </div>
      ) : (
        <div className="text-center py-10">
          <p className="text-xl mb-4">Giỏ hàng của bạn đang trống.</p>
          <Link to="/shop" className="text-blue-500 hover:underline">
            Tiếp tục mua sắm
          </Link>
        </div>
      )}
    </div>
  );
};

export default CartPage;