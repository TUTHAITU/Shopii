import React from "react";
import { useAuth } from "../../context/AuthContext";

const Header = () => {
  const { logout } = useAuth();

  return (
    <header className="bg-gray-800 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <div>
          <span>03:55 PM +07, Tuesday, June 10, 2025</span>
          <button className="ml-4 bg-red-500 p-2 rounded" onClick={logout}>
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
