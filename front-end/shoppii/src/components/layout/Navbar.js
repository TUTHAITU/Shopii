import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const Navbar = () => {
  const { currentUser, logout, isAuthenticated } = useAuth();

  return (
    <nav className="bg-gray-800 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center">
          {isAuthenticated ? (
            <>
              <span className="mr-4">Welcome, {currentUser?.username}</span>
              <button className="bg-red-500 p-2 rounded" onClick={logout}>
                Logout
              </button>
            </>
          ) : (
            <div className="space-x-4">
              <Link to="/login" className="bg-blue-500 p-2 rounded">
                Login
              </Link>
              <Link to="/register" className="bg-green-500 p-2 rounded">
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
