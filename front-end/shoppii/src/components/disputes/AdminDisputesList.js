import React from 'react';
import { Link } from 'react-router-dom';
import { useFetchData } from '../../hooks/useFetchData';
import Loading from '../layout/Loading';
import { useAuth } from '../../context/AuthContext';

const AdminDisputesList = () => {
  const { data: disputes, loading, error } = useFetchData('/api/admin/disputes');
  const { currentUser, isAuthenticated } = useAuth();

  if (!isAuthenticated) return <div className="p-4 text-red-500">Please log in to access this page.</div>;
  if (loading) return <Loading />;
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>;
  if (currentUser && currentUser.role !== 'admin') return <div className="p-4 text-red-500">Access denied. Admin role required.</div>;

  return (
    <div className="p-4">
      <h2 className="text-xl mb-4">Dispute Management</h2>
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-200">
            <th className="border p-2">ID</th>
            <th className="border p-2">Order ID</th>
            <th className="border p-2">Raised By</th>
            <th className="border p-2">Status</th>
            <th className="border p-2">Action</th>
          </tr>
        </thead>
        <tbody>
          {disputes && disputes.map(dispute => (
            <tr key={dispute._id} className="hover:bg-gray-100">
              <td className="border p-2">{dispute._id}</td>
              <td className="border p-2">{dispute.orderId?._id}</td>
              <td className="border p-2">{dispute.raisedBy?.username}</td>
              <td className="border p-2">{dispute.status}</td>
              <td className="border p-2">
                <Link to={`/disputes/${dispute._id}`} className="bg-blue-500 text-white p-1 rounded">Update</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminDisputesList;