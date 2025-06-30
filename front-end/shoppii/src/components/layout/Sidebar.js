import React from "react";

const Sidebar = ({ onNavigate }) => {
  const menuItems = [
    { name: "Dashboard", id: "dashboard" },
    { name: "Users", id: "users" },
    { name: "Stores", id: "stores" },
    { name: "Categories", id: "categories" },
    { name: "Disputes", id: "disputes" },
    { name: "Coupons", id: "coupons" },
    { name: "Products", id: "products" },
    { name: "Orders", id: "orders" },
    { name: "Reviews", id: "reviews" },
    { name: "Feedback", id: "feedback" },
  ];

  return (
    <div className="w-64 bg-gray-900 text-white h-screen p-4">
      <h2 className="text-xl mb-4">Menu</h2>
      <ul>
        {menuItems.map((item) => (
          <li key={item.id} className="mb-2">
            <button
              className="hover:text-gray-300 w-full text-left"
              onClick={() => onNavigate(item.id)}
            >
              {item.name}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Sidebar;
