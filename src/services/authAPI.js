import { apiPost, apiGet } from './apiHelper_fixed';

/**
 * Authentication API endpoints
 */
export const authAPI = {
  /**
   * Login user
   * @param {object} credentials - {email, password}
   * @param {function} onSuccess - Success callback
   * @param {function} onError - Error callback
   */
  login: (credentials, onSuccess, onError) =>
    apiPost('/login/', credentials, onSuccess, onError),

  /**
   * Logout user
   * @param {function} onSuccess - Success callback
   * @param {function} onError - Error callback
   */
  logout: (onSuccess, onError) =>
    apiPost('/logout/', {}, onSuccess, onError),

  /**
   * Get current user profile
   * @param {function} onSuccess - Success callback
   * @param {function} onError - Error callback
   */
  getProfile: (onSuccess, onError) =>
    apiGet('/profile/', onSuccess, onError),

  /**
   * Refresh access token
   * @param {string} refreshToken - Refresh token
   * @param {function} onSuccess - Success callback
   * @param {function} onError - Error callback
   */
  refreshToken: (refreshToken, onSuccess, onError) =>
    apiPost('/token/refresh/', { refresh: refreshToken }, onSuccess, onError),
};

export default authAPI;
