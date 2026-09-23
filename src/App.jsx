import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AdminLayout from "layouts/admin";
import AuthLayout from "layouts/auth";
import { AuthProvider, useAuth } from "contexts/AuthContext";
import ScrollToTop from "./ScrollToTop";

const ProtectedApp = () => {
  const { isAuthenticated, isSuperAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-white dark:bg-navy-900">
        <div className="border-t-transparent h-12 w-12 animate-spin rounded-full border-4 border-brand-500"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="auth/*" element={<AuthLayout />} />
      <Route
        path="admin/*"
        element={
          isAuthenticated ? (
            isSuperAdmin ? (
              <AdminLayout />
            ) : (
              <Navigate to="/employee/dashboard" replace />
            )
          ) : (
            <Navigate to="/auth/sign-in" replace />
          )
        }
      />
      <Route
        path="employee/*"
        element={
          isAuthenticated ? (
            isSuperAdmin ? (
              <Navigate to="/admin/dashboard" replace />
            ) : (
              <AdminLayout />
            )
          ) : (
            <Navigate to="/auth/sign-in" replace />
          )
        }
      />
      <Route
        path="/"
        element={
          isAuthenticated ? (
            <Navigate
              to={isSuperAdmin ? "/admin/dashboard" : "/employee/dashboard"}
              replace
            />
          ) : (
            <Navigate to="/auth/sign-in" replace />
          )
        }
      />
    </Routes>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <ScrollToTop />
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      <ProtectedApp />
    </AuthProvider>
  );
};

export default App;
