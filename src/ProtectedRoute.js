import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ allowedRoles, children }) => {
  const isSuperAdmin = localStorage.getItem("is_super_admin") === "true";

  const role = isSuperAdmin ? "super_admin" : "admin";

  if (!allowedRoles.includes(role)) {
    return (
      <Navigate
        to={isSuperAdmin ? "/admin/dashboard" : "/employee/dashboard"}
        replace
      />
    );
  }

  return children;
};

export default ProtectedRoute;
