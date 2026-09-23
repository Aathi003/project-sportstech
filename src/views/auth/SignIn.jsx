import { useState } from "react";
import { useNavigate } from "react-router-dom";
import InputField from "components/fields/InputField";
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
          const cleanToken = token.startsWith("Bearer ")
            ? token.substring(7)
            : token;

          // Pass latecoming from API response into context
          login(
            response.user_id,
            cleanToken,
            response.user_name,
            response.is_super_admin,
            response.late_coming,
            response.employee_id,
            response.emp_id,
            response.is_wfh_enabled
          );

          showSuccess("Logged in successfully");

          const isSuperAdminUser =
            response.is_super_admin === true ||
            String(response.is_super_admin).toLowerCase() === "true";

          navigate(
            isSuperAdminUser ? "/admin/dashboard" : "/employee/dashboard"
          );
        } else {
          showError("Invalid login response");
        }
        setLoading(false);
      },
      (err) => {
        const errorMessage = err?.message || err?.detail || "Login failed";
        setError(errorMessage);
        showError(errorMessage);
        setLoading(false);
      }
    );
  };

  return (
    <div className="mb-16 flex h-full w-full items-center justify-center px-2 md:mx-0 md:px-0 lg:mb-10 lg:items-center lg:justify-start">
      <div className="mt-[10vh] flex w-full max-w-full flex-col items-center justify-center md:pl-4 lg:pl-0 xl:max-w-[420px]">
        <h4 className="mb-2.5 text-3xl font-bold text-navy-700 dark:text-white">
          Log In
        </h4>
        <p className="mb-9 text-base text-gray-600">
          Enter your email and password to Log in!
        </p>

        {error && (
          <div className="mb-4 w-full rounded-lg border border-red-500 bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="w-full">
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
            className="linear mt-2 w-full rounded-xl bg-brand-500 py-[12px] text-base font-medium text-white transition duration-200 hover:bg-blue-600 active:bg-brand-700 disabled:opacity-50 dark:bg-brand-400 dark:text-white dark:hover:bg-brand-300 dark:active:bg-brand-200"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
