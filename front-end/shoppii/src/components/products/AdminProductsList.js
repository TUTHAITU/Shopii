import React from "react";
import { Link } from "react-router-dom";
import { useFetchData } from "../../hooks/useFetchData";
import Loading from "../layout/Loading";
import { useAuth } from "../../context/AuthContext";

const AdminProductsList = () => {
  const {
    data: products,
    loading,
    error,
  } = useFetchData("/api/admin/products");
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
      <h2 className="text-xl mb-4">Product Management</h2>
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-200">
            <th className="border p-2">ID</th>
            <th className="border p-2">Title</th>
            <th className="border p-2">Price</th>
            <th className="border p-2">Action</th>
          </tr>
        </thead>
        <tbody>
          {products &&
            products.map((product) => (
              <tr key={product._id} className="hover:bg-gray-100">
                <td className="border p-2">{product._id}</td>
                <td className="border p-2">{product.title}</td>
                <td className="border p-2">{product.price}</td>
                <td className="border p-2">
                  <Link
                    to={`/products/delete/${product._id}`}
                    className="bg-red-500 text-white p-1 rounded"
                  >
                    Delete
                  </Link>
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminProductsList;
