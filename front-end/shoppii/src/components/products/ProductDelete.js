import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Loading from "../layout/Loading";
import { useAuth } from "../../context/AuthContext";

const ProductDelete = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { currentUser, isAuthenticated } = useAuth();

  const handleDelete = async () => {
    try {
      await axios.delete(
        `http://localhost:9999/api/admin/products/${productId}`
      );
      navigate("/products");
    } catch (err) {
      alert("Error deleting product");
    }
  };

  if (!isAuthenticated)
    return (
      <div className="p-4 text-red-500">Please log in to access this page.</div>
    );
  if (currentUser && currentUser.role !== "admin")
    return (
      <div className="p-4 text-red-500">
        Access denied. Admin role required.
      </div>
    );

  return (
    <div className="p-4">
      <h2 className="text-xl mb-4">Delete Product</h2>
      <p>Are you sure you want to delete this product?</p>
      <button
        onClick={handleDelete}
        className="bg-red-500 text-white p-2 rounded mr-2"
      >
        Confirm Delete
      </button>
      <button
        onClick={() => navigate("/products")}
        className="bg-gray-500 text-white p-2 rounded"
      >
        Cancel
      </button>
    </div>
  );
};

export default ProductDelete;
