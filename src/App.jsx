import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import RtlLayout from "layouts/rtl";
import AdminLayout from "layouts/admin";
import AuthLayout from "layouts/auth";
import { AuthProvider, useAuth } from "contexts/AuthContext";

const ProtectedApp = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-white dark:bg-navy-900">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="auth/*" element={<AuthLayout />} />
      <Route path="admin/*" element={isAuthenticated ? <AdminLayout /> : <Navigate to="/auth/sign-in" replace />} />
      <Route path="rtl/*" element={isAuthenticated ? <RtlLayout /> : <Navigate to="/auth/sign-in" replace />} />
      <Route path="/" element={isAuthenticated ? <Navigate to="/admin/Dashboard" replace /> : <Navigate to="/auth/sign-in" replace />} />
    </Routes>
  );
};

const App = () => {
  return (
    <AuthProvider>
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
