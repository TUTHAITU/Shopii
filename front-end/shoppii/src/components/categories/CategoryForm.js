import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useFetchData } from "../../hooks/useFetchData";
import axios from "axios";
import Loading from "../layout/Loading";
import { useAuth } from "../../context/AuthContext";

const CategoryForm = () => {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const { currentUser, isAuthenticated } = useAuth();

  // Call useFetchData unconditionally, passing null if no categoryId
  const {
    data: category,
    loading,
    error,
  } = useFetchData(categoryId ? `/api/admin/categories/${categoryId}` : null);

  const [formData, setFormData] = useState({ name: "" });

  useEffect(() => {
    if (category) {
      setFormData({ name: category.name || "" });
    }
  }, [category]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (categoryId) {
        await axios.put(
          `http://localhost:9999/api/admin/categories/${categoryId}`,
          formData
        );
      } else {
        await axios.post(
          "http://localhost:9999/api/admin/categories",
          formData
        );
      }
      navigate("/categories");
    } catch (err) {
      alert("Error saving category");
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
      <h2 className="text-xl mb-4">
        {categoryId ? "Edit Category" : "Create Category"}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block">Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </div>
        <button type="submit" className="bg-blue-500 text-white p-2 rounded">
          Save
        </button>
      </form>
    </div>
  );
};

export default CategoryForm;
