import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [name, setName] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [latecoming, setLatecoming] = useState(null);

  useEffect(() => {
    const storedToken = localStorage.getItem("access_token");
    const storedUser = localStorage.getItem("user_id");
    const storedName = localStorage.getItem("user_name");
    const storedSuperAdmin = localStorage.getItem("is_super_admin");

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(storedUser);
      setName(storedName);
      setIsSuperAdmin(storedSuperAdmin === "true" || storedSuperAdmin === true);
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const login = (
    userData,
    authToken,
    user_name,
    is_super_admin,
    late_coming,
    employee_id,
    emp_id,
    is_wfh_enabled
  ) => {
    setUser(userData);
    setToken(authToken);
    setName(user_name);
    setIsSuperAdmin(is_super_admin);
    setIsAuthenticated(true);
    setLatecoming(late_coming ?? null);

    localStorage.setItem("access_token", authToken);
    localStorage.setItem("user_id", userData);
    localStorage.setItem("user_name", user_name);
    localStorage.setItem("is_super_admin", is_super_admin);
    localStorage.setItem(
      "is_wfh_enabled",
      is_wfh_enabled === true ? "true" : "false"
    );

    if (
      employee_id !== null &&
      employee_id !== undefined &&
      employee_id !== ""
    ) {
      localStorage.setItem("employee_id", employee_id);
    } else {
      localStorage.removeItem("employee_id");
    }

    if (emp_id !== null && emp_id !== undefined && emp_id !== "") {
      localStorage.setItem("emp_id", emp_id);
    } else {
      localStorage.removeItem("emp_id");
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setIsSuperAdmin(false);
    setIsAuthenticated(false);
    setLatecoming(null);

    localStorage.removeItem("access_token");
    localStorage.removeItem("user_id");
    localStorage.removeItem("is_super_admin");
    localStorage.removeItem("user_name");
    localStorage.removeItem("employee_id");
    localStorage.removeItem("emp_id");
    localStorage.removeItem("is_wfh_enabled");
  };

  const value = {
    user,
    token,
    name,
    isAuthenticated,
    isSuperAdmin,
    loading,
    login,
    logout,
    latecoming,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
