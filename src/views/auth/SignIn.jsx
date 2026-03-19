import { useState } from "react";
import { useNavigate } from "react-router-dom";
import InputField from "components/fields/InputField";
import { FcGoogle } from "react-icons/fc";
import Checkbox from "components/checkbox";
import authAPI from "services/authAPI";
import { useAuth } from "contexts/AuthContext";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { showSuccess, showError } from "utils/toastHelper";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    authAPI.login(
      { email, password },
      (response) => {
        if (response?.access || response?.access_token) {
          const token = response.access || response.access_token;
          // Remove 'Bearer ' prefix if already present to store clean token
          const cleanToken = token.startsWith("Bearer ")
            ? token.substring(7)
            : token;
          // Set auth state from API response
          login(
            response.user_id,
            cleanToken,
            response.user_name,
            response.is_super_admin
          );

          // Determine user role and store in localStorage
          let userRole = "User"; // Default role
          if (
            response.user?.is_super_admin === "true" ||
            response.user?.is_super_admin === true
          ) {
            userRole = "Admin";
          } else if (
            response.user?.role === "Admin" ||
            response.user?.role?.role_name === "Admin"
          ) {
            userRole = "Admin";
          } else if (response.user?.role?.role_name) {
            userRole = response.user.role.role_name;
          } else if (response.user?.role) {
            userRole = response.user.role;
          }

          // Role-based redirect
          if (
            response.user?.is_super_admin === "true" ||
            response.user?.is_super_admin === true
          ) {
            navigate("/admin/dashboard");
          } else if (
            response.user?.role === "Admin" ||
            response.user?.role?.role_name === "Admin"
          ) {
            navigate("/admin/dashboard");
          } else {
            navigate("/admin/dashboard");
          }
        } else {
          showError("Invalid login response");
        }

        setLoading(false);
      },
      (error) => {
        // Custom error message for invalid credentials
        let errorMessage = error?.message || error?.detail || "Login failed";
        if (
          errorMessage.toLowerCase().includes("email is incorrect") ||
          errorMessage.toLowerCase().includes("invalid credentials")
        ) {
          errorMessage = "Email or password is incorrect";
        }
        setError(errorMessage);
        showError(errorMessage);
        setLoading(false);
      }
    );
  };

  return (
    <div className=" mb-16 flex h-full w-full items-center justify-center px-2 md:mx-0 md:px-0 lg:mb-10 lg:items-center lg:justify-start">
      {/* Sign in section */}
      <div className="mt-[10vh] w-full max-w-full flex-col items-center md:pl-4 lg:pl-0 xl:max-w-[420px]">
        <h4 className="ml-15 mb-2.5 text-3xl font-bold text-navy-700 dark:text-white">
          Log In
        </h4>
        <p className="mb-9 text-base text-gray-600">
          Enter your email and password to Log in!
        </p>

        {error && (
          <div className="mb-4 rounded-lg border border-red-500 bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="w-full">
          {/* Email */}
          <div className="mb-3">
            <InputField
              variant="auth"
              label="Email*"
              placeholder="Enter your email"
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* Password */}
          <div className="mb-3">
            <InputField
              variant="auth"
              label="Password*"
              placeholder="Enter your password"
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={showPassword ? <FaEyeSlash /> : <FaEye />}
              onIconClick={() => setShowPassword(!showPassword)}
            />
          </div>

          {/* Checkbox */}
          <div className="mb-4 flex items-center justify-between px-2">
            <div className="flex items-center">
              <Checkbox
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <p className="ml-2 text-sm font-medium text-navy-700 dark:text-white">
                Keep me logged In
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="linear mt-2 w-full rounded-xl bg-brand-500 py-[12px] text-base font-medium text-white transition duration-200 hover:bg-brand-600 active:bg-brand-700 disabled:opacity-50 dark:bg-brand-400 dark:text-white dark:hover:bg-brand-300 dark:active:bg-brand-200"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
