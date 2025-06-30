import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useFetchData } from "../../hooks/useFetchData";
import axios from "axios";
import Loading from "../layout/Loading";
import { useAuth } from "../../context/AuthContext";

const UserForm = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { currentUser, isAuthenticated } = useAuth();

  // Call useFetchData unconditionally, but only pass the URL if userId exists
  const {
    data: user,
    loading,
    error,
  } = useFetchData(userId ? `/api/admin/users/${userId}` : null);

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    role: "buyer",
    action: "unlock",
  });

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || "",
        email: user.email || "",
        role: user.role || "buyer",
        action: user.action || "unlock",
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (userId) {
        await axios.put(
          `http://localhost:9999/api/admin/users/${userId}`,
          formData
        );
      } else {
        await axios.post("http://localhost:9999/api/admin/users", formData);
      }
      navigate("/users");
    } catch (err) {
      alert("Error saving user");
    }
  };

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
      <h2 className="text-xl mb-4">{userId ? "Edit User" : "Create User"}</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block">Username</label>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label className="block">Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label className="block">Role</label>
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          >
            <option value="buyer">Buyer</option>
            <option value="seller">Seller</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div>
          <label className="block">Action</label>
          <select
            name="action"
            value={formData.action}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          >
            <option value="unlock">Unlock</option>
            <option value="lock">Lock</option>
          </select>
        </div>
        <button type="submit" className="bg-blue-500 text-white p-2 rounded">
          Save
        </button>
      </form>
    </div>
  );
};

export default UserForm;
