import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Loading from '../layout/Loading';
import { useAuth } from '../../context/AuthContext';

const DisputeForm = () => {
  const { disputeId } = useParams();
  const navigate = useNavigate();
  const { currentUser, isAuthenticated } = useAuth();
  const [formData, setFormData] = useState({ status: 'open', resolution: '' });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`http://localhost:9999/api/admin/disputes/${disputeId}`, formData);
      navigate('/disputes');
    } catch (err) {
      alert('Error updating dispute');
    }
  };

  if (!isAuthenticated) return <div className="p-4 text-red-500">Please log in to access this page.</div>;
  if (currentUser && currentUser.role !== 'admin') return <div className="p-4 text-red-500">Access denied. Admin role required.</div>;

  return (
    <div className="p-4">
      <h2 className="text-xl mb-4">Update Dispute</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block">Status</label>
          <select name="status" value={formData.status} onChange={handleChange} className="w-full p-2 border rounded">
            <option value="open">Open</option>
            <option value="under_review">Under Review</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
        </div>
        <div>
          <label className="block">Resolution</label>
          <textarea name="resolution" value={formData.resolution} onChange={handleChange} className="w-full p-2 border rounded"></textarea>
        </div>
        <button type="submit" className="bg-blue-500 text-white p-2 rounded">Update</button>
      </form>
    </div>
  );
};

export default DisputeForm;