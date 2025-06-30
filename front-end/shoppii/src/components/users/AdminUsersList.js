import React from "react";
import { Link } from "react-router-dom";
import { useFetchData } from "../../hooks/useFetchData";
import Loading from "../layout/Loading";
import { useAuth } from "../../context/AuthContext";

const AdminUsersList = () => {
  const { data: users, loading, error } = useFetchData("/api/admin/users");
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
      <h2 className="text-xl mb-4">User Management</h2>
      <Link
        to="/users/edit/:userId"
        className="bg-green-500 text-white p-2 rounded mb-4 inline-block"
      >
        Edit User
      </Link>
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-200">
            <th className="border p-2">ID</th>
            <th className="border p-2">Username</th>
            <th className="border p-2">Role</th>
            <th className="border p-2">Action</th>
          </tr>
        </thead>
        <tbody>
          {users &&
            users.map((user) => (
              <tr key={user._id} className="hover:bg-gray-100">
                <td className="border p-2">{user._id}</td>
                <td className="border p-2">{user.username}</td>
                <td className="border p-2">{user.role}</td>
                <td className="border p-2">
                  <Link
                    to={`/users/edit/${user._id}`}
                    className="bg-blue-500 text-white p-1 rounded mr-2"
                  >
                    Edit
                  </Link>
                  <button
                    className="bg-red-500 text-white p-1 rounded"
                    onClick={() => alert(`Delete ${user.username}`)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminUsersList;
