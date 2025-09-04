import { useState, useEffect } from "react";
import axios from "axios";
import { AuthContext } from "./auth-context.js";

// Create auth provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  const login = async (credentials) => {
    setLoading(true);
    try {
      const response = await axios.post(
        "http://localhost:3000/api/login",
        credentials
      );
      // Server returns { success, data: user, token }
      const { token, data: user } = response.data;

      // Store token in localStorage
      localStorage.setItem("token", token);

      // Set authorization header for future requests
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      setUser(user);
      return { success: true, data: user, token };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    setLoading(true);
    try {
      const response = await axios.post(
        "http://localhost:3000/api/register",
        userData
      );
      const { token, data: user } = response.data;

      // Store token in localStorage
      localStorage.setItem("token", token);

      // Set authorization header for future requests
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      setUser(user);
      return { success: true, data: user, token };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    delete axios.defaults.headers.common["Authorization"];
    setUser(null);
  };

  // Check if user is already logged in on mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      // Verify token and get user data
      axios
        .get("/api/auth/me")
        .then((response) => {
          setUser(response.data);
        })
        .catch(() => {
          localStorage.removeItem("token");
          delete axios.defaults.headers.common["Authorization"];
        });
    }
  }, []);

  const value = {
    user,
    loading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
