import React from "react";
import { useParams } from "react-router-dom";
import { useFetchData } from "../../hooks/useFetchData";
import Loading from "../layout/Loading";
import { useAuth } from "../../context/AuthContext";

const OrderDetails = () => {
  const { orderId } = useParams();
  const {
    data: order,
    loading,
    error,
  } = useFetchData(`/api/admin/orders/${orderId}`);
  const { currentUser, isAuthenticated } = useAuth();

  if (!isAuthenticated)
    return (
      <div className="p-4 text-red-500">Please log in to access this page.</div>
    );
  if (loading) return <Loading />;
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>;
  if (currentUser && currentUser.role !== "admin")
    return (
      <div className="p-4 text-red-500">
        Access denied. Admin role required.
      </div>
    );

  return (
    <div className="p-4">
      <h2 className="text-xl mb-4">Order Details</h2>
      {order && (
        <div>
          <p>
            <strong>ID:</strong> {order._id}
          </p>
          <p>
            <strong>Buyer:</strong> {order.buyerId?.username}
          </p>
          <p>
            <strong>Total Price:</strong> {order.totalPrice}
          </p>
          <p>
            <strong>Status:</strong> {order.status}
          </p>
          <h3 className="mt-4">Items</h3>
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-200">
                <th className="border p-2">Product</th>
                <th className="border p-2">Quantity</th>
                <th className="border p-2">Unit Price</th>
              </tr>
            </thead>
            <tbody>
              {order.items &&
                order.items.map((item) => (
                  <tr key={item._id} className="hover:bg-gray-100">
                    <td className="border p-2">{item.productId?.title}</td>
                    <td className="border p-2">{item.quantity}</td>
                    <td className="border p-2">{item.unitPrice}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default OrderDetails;
