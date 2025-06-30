import React from 'react';
import { Link } from 'react-router-dom';
import { useFetchData } from '../../hooks/useFetchData';
import Loading from '../layout/Loading';
import { useAuth } from '../../context/AuthContext';

const AdminOrdersList = () => {
  const { data: orders, loading, error } = useFetchData('/api/admin/orders');
  const { currentUser, isAuthenticated } = useAuth();

  if (!isAuthenticated) return <div className="p-4 text-red-500">Please log in to access this page.</div>;
  if (loading) return <Loading />;
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>;
  if (currentUser && currentUser.role !== 'admin') return <div className="p-4 text-red-500">Access denied. Admin role required.</div>;

  return (
    <div className="p-4">
      <h2 className="text-xl mb-4">Order Management</h2>
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-200">
            <th className="border p-2">ID</th>
            <th className="border p-2">Buyer</th>
            <th className="border p-2">Total Price</th>
            <th className="border p-2">Status</th>
            <th className="border p-2">Action</th>
          </tr>
        </thead>
        <tbody>
          {orders && orders.map(order => (
            <tr key={order._id} className="hover:bg-gray-100">
              <td className="border p-2">{order._id}</td>
              <td className="border p-2">{order.buyerId?.username}</td>
              <td className="border p-2">{order.totalPrice}</td>
              <td className="border p-2">{order.status}</td>
              <td className="border p-2">
                <Link to={`/orders/${order._id}`} className="bg-blue-500 text-white p-1 rounded mr-2">Details</Link>
                <Link to={`/orders/${order._id}/status`} className="bg-green-500 text-white p-1 rounded">Update Status</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminOrdersList;