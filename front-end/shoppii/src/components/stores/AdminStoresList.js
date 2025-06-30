import React from 'react';
import { Link } from 'react-router-dom';
import { useFetchData } from '../../hooks/useFetchData';
import Loading from '../layout/Loading';
import { useAuth } from '../../context/AuthContext';

const AdminStoresList = () => {
  const { data: stores, loading, error } = useFetchData('/api/admin/stores');
  const { currentUser, isAuthenticated } = useAuth();

  if (!isAuthenticated) return <div className="p-4 text-red-500">Please log in to access this page.</div>;
  if (loading) return <Loading />;
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>;
  if (currentUser && currentUser.role !== 'admin') return <div className="p-4 text-red-500">Access denied. Admin role required.</div>;

  return (
    <div className="p-4">
      <h2 className="text-xl mb-4">Store Management</h2>
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-200">
            <th className="border p-2">ID</th>
            <th className="border p-2">Store Name</th>
            <th className="border p-2">Seller</th>
            <th className="border p-2">Status</th>
            <th className="border p-2">Action</th>
          </tr>
        </thead>
        <tbody>
          {stores && stores.map(store => (
            <tr key={store._id} className="hover:bg-gray-100">
              <td className="border p-2">{store._id}</td>
              <td className="border p-2">{store.storeName}</td>
              <td className="border p-2">{store.sellerId?.username}</td>
              <td className="border p-2">{store.status}</td>
              <td className="border p-2">
                <Link to={`/stores/${store._id}/status`} className="bg-blue-500 text-white p-1 rounded">Update Status</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminStoresList;