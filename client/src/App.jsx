import React, { Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/index.js";
import LoadingSpinner from "./components/LoadingSpinner";
import ErrorBoundary from "./components/ErrorBoundary";
import Login from "./components/Login";
import RegistrationForm from "./components/RegistrationForm";
import EnvBadge from "./components/EnvBadge";
import ForgotPassword from "./components/ForgotPassword";
import ResetPassword from "./components/ResetPassword";
import ResetPasswordModal from "./components/ResetPasswordModal";
import SiteHeader from "./components/SiteHeader";
import SiteFooter from "./components/SiteFooter";
import "./App.css";

// Protected Route Component
const ProtectedRoute = ({ element, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div
        className="loading-container"
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/login" replace />;
  }

  return typeof element === "function" ? element() : element;
};

const CustomerDashboard = React.lazy(() =>
  import("./components/CustomerDashboard")
);
const AgentDashboard = React.lazy(() => import("./components/AgentDashboard"));
const AdminDashboard = React.lazy(() => import("./components/AdminDashboard"));

function App() {
  return (
    <ErrorBoundary>
      <SiteHeader />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<RegistrationForm />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route
          path="/reset-password/modal"
          element={
            <ResetPasswordModal
              open={true}
              onClose={() => window.history.back()}
            />
          }
        />

        {/* Protected Routes */}
        <Route
          path="/customer/dashboard"
          element={
            <ProtectedRoute
              element={<CustomerDashboard />}
              allowedRoles={["customer"]}
            />
          }
        />
        <Route
          path="/agent/dashboard"
          element={
            <ProtectedRoute
              element={<AgentDashboard />}
              allowedRoles={["agent"]}
            />
          }
        />
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute
              element={<AdminDashboard />}
              allowedRoles={["admin"]}
            />
          }
        />

        {/* Redirect root to login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
      <SiteFooter />
    </ErrorBoundary>
  );
}

export default App;
