import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Loading from '../layout/Loading';
import { useAuth } from '../../context/AuthContext';

const StoreStatusForm = () => {
  const { storeId } = useParams();
  const navigate = useNavigate();
  const { currentUser, isAuthenticated } = useAuth();
  const [status, setStatus] = useState('pending');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`http://localhost:9999/api/admin/stores/${storeId}/status`, { status });
      navigate('/stores');
    } catch (err) {
      alert('Error updating store status');
    }
  };

  if (!isAuthenticated) return <div className="p-4 text-red-500">Please log in to access this page.</div>;
  if (currentUser && currentUser.role !== 'admin') return <div className="p-4 text-red-500">Access denied. Admin role required.</div>;

  return (
    <div className="p-4">
      <h2 className="text-xl mb-4">Update Store Status</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block">Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full p-2 border rounded">
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        <button type="submit" className="bg-blue-500 text-white p-2 rounded">Update</button>
      </form>
    </div>
  );
};

export default StoreStatusForm;