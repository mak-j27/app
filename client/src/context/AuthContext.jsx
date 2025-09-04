import { useState, useEffect } from "react";
import axios from "axios";
import { AuthContext } from './auth-context';

// API URL
const API_URL = "http://localhost:3000/api";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const login = async (credentials) => {
    setLoading(true);
    setError(null);
    try {
  const response = await axios.post(`${API_URL}/login`, credentials);
  // Server returns { success, data: user, token }
  const { token, data: user } = response.data;

  // Store token and set headers
  localStorage.setItem("token", token);
  axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

  setUser(user);
  return { success: true, data: user, token };
    } catch (err) {
      const message = err.response?.data?.message || err.message;
      setError(message);
  return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };
  const register = async (userData) => {
    setLoading(true);
    setError(null);
    try {
      // Do not log userData as it may contain sensitive information (passwords)
      const response = await axios.post(`${API_URL}/register`, userData);
      
      const { token, data: user, message } = response.data;

      // Store token and set headers
      localStorage.setItem("token", token);
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      setUser(user);
      return { 
        success: true, 
        data: user,
        message: message || "Registration successful!"
      };
    } catch (err) {
      console.error('Registration error:', err.response || err);
      const message = err.response?.data?.message || err.message || "Registration failed";
      setError(message);
      if (err.response?.data?.success === true) {
        // If the server indicates success despite the error
        return {
          success: true,
          data: err.response.data.data,
          message: err.response.data.message || "Registration successful!"
        };
      }
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    delete axios.defaults.headers.common["Authorization"];
    setUser(null);
    setError(null);
  };

  const clearError = () => {
    setError(null);
  };

  // Check if user is already logged in on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
          const response = await axios.get(`${API_URL}/auth/me`);
          setUser(response.data);
        } catch (error) {
          localStorage.removeItem("token");
          delete axios.defaults.headers.common["Authorization"];
          setError(error.response?.data?.message || "Session expired. Please login again.");
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
export default AuthProvider;
// Note: do not export hooks or utilities from this component file to avoid Fast Refresh issues.
