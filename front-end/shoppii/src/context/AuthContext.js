import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem("token");
      const user = localStorage.getItem("user");

      if (token && user) {
        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

        try {
          const res = await axios.get(
            "http://localhost:9999/api/users/profile"
          );
          setCurrentUser(res.data);
          setIsAuthenticated(true);
        } catch (err) {
          console.error("Auto-login failed", err);
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          delete axios.defaults.headers.common["Authorization"];
        }
      }

      setLoading(false);
    };

    loadUser();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await axios.post(
        "http://localhost:9999/api/auth/login",
        {
          email,
          password,
        }
      );
      const { token, user } = response.data;

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      setCurrentUser(user);
      setIsAuthenticated(true);

      return user;
    } catch (err) {
      throw err.response?.data?.message || "Login failed";
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    delete axios.defaults.headers.common["Authorization"];
    setCurrentUser(null);
    setIsAuthenticated(false);
  };

  const value = {
    currentUser,
    setCurrentUser,
    isAuthenticated,
    setIsAuthenticated,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
