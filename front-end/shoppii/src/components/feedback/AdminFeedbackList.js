import React from "react";
import { useFetchData } from "../../hooks/useFetchData";
import Loading from "../layout/Loading";
import { useAuth } from "../../context/AuthContext";

const AdminFeedbackList = () => {
  const {
    data: feedback,
    loading,
    error,
  } = useFetchData("/api/admin/seller-feedback");
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
      <h2 className="text-xl mb-4">Seller Feedback Management</h2>
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-200">
            <th className="border p-2">ID</th>
            <th className="border p-2">Seller</th>
            <th className="border p-2">Average Rating</th>
            <th className="border p-2">Total Reviews</th>
          </tr>
        </thead>
        <tbody>
          {feedback &&
            feedback.map((f) => (
              <tr key={f._id} className="hover:bg-gray-100">
                <td className="border p-2">{f._id}</td>
                <td className="border p-2">{f.sellerId?.username}</td>
                <td className="border p-2">{f.averageRating}</td>
                <td className="border p-2">{f.totalReviews}</td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminFeedbackList;
