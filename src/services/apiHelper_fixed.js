import axios from "axios";

import { API_BASE } from "services/apiConfig";
const api = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add JWT token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Redirect to login immediately when token expires
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.clear();
      window.location.href = "/auth/sign-in";
    }
    return Promise.reject(error);
  }
);

/**
 * Extract error message from various error response formats
 * @param {object} error - Error object from axios
 * @returns {string|object} - Formatted error message or object with detailed errors
 */
const getErrorMessage = (error) => {
  if (!error) return "An unknown error occurred";

  // Handle axios error response
  if (error.response) {
    const { status, data } = error.response;

    // Check for various error message formats
    if (data?.detail) return data.detail;
    if (data?.message) return data.message;

    // Handle field-specific errors directly in data (e.g., {serial_number: ["error message"]})
    if (
      data &&
      typeof data === "object" &&
      !Array.isArray(data) &&
      !data?.error &&
      !data?.errors
    ) {
      const fieldErrors = [];
      Object.entries(data).forEach(([field, messages]) => {
        if (Array.isArray(messages) && messages.length > 0) {
          // Extract first message from array
          fieldErrors.push(messages[0]);
        } else if (typeof messages === "string" && messages) {
          fieldErrors.push(messages);
        }
      });
      if (fieldErrors.length > 0) {
        return fieldErrors[0]; // Return first error message
      }
    }

    // Handle error with details object (field-specific errors)
    if (data?.error && data?.details) {
      const fieldErrors = [];
      Object.entries(data.details).forEach(([field, messages]) => {
        if (Array.isArray(messages)) {
          fieldErrors.push(`${field}: ${messages.join(", ")}`);
        } else {
          fieldErrors.push(`${field}: ${messages}`);
        }
      });
      // Return combined message with main error and field details
      const detailsText =
        fieldErrors.length > 0 ? " - " + fieldErrors.join(" | ") : "";
      return data.error + detailsText;
    }

    if (data?.error) return data.error;
    if (data?.errors) {
      // Handle array of errors
      if (Array.isArray(data.errors)) {
        return data.errors.map((e) => e.message || e).join(", ");
      }
      // Handle object of errors
      return Object.entries(data.errors)
        .map(([key, value]) => `${key}: ${value}`)
        .join(", ");
    }

    // If no specific error message found, return detailed status message
    return `Error ${status}: ${JSON.stringify(data) || "Request failed"}`;
  }

  // Network error or no response
  if (error.message) return error.message;

  return "An unknown error occurred";
};

/**
 * Generic GET request handler
 * @param {string} endpoint - API endpoint
 * @param {function} onSuccess - Callback on success
 * @param {function} onError - Callback on error
 */
export const apiGet = async (endpoint, onSuccess, onError) => {
  try {
    const response = await api.get(endpoint);
    if (onSuccess) {
      onSuccess(response.data);
    }
    return response.data;
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    const errorStatus = error.response?.status;

    const errorObject = {
      message: errorMessage,
      status: errorStatus,
      data: error.response?.data,
    };

    if (onError) {
      onError(errorObject);
    } else {
      return { error: errorObject };
    }
  }
};

/**
 * Generic POST request handler
 * @param {string} endpoint - API endpoint
 * @param {object} data - Request payload
 * @param {function} onSuccess - Callback on success
 * @param {function} onError - Callback on error
 */
export const apiPost = async (endpoint, data, onSuccess, onError) => {
  try {
    const response = await api.post(endpoint, data);
    if (onSuccess) {
      onSuccess(response.data);
    }
    return response.data;
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    const errorStatus = error.response?.status;

    const errorObject = {
      message: errorMessage,
      status: errorStatus,
      data: error.response?.data,
    };

    if (onError) {
      onError(errorObject);
    } else {
      // If no error callback provided, return error object so caller can handle it
      return { error: errorObject };
    }
  }
};

/**
 * Generic PUT/UPDATE request handler
 * @param {string} endpoint - API endpoint
 * @param {object} data - Request payload
 * @param {function} onSuccess - Callback on success
 * @param {function} onError - Callback on error
 */
export const apiUpdate = async (endpoint, data, onSuccess, onError) => {
  try {
    const response = await api.put(endpoint, data);
    if (onSuccess) {
      onSuccess(response.data);
    }
    return response.data;
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    const errorStatus = error.response?.status;

    const errorObject = {
      message: errorMessage,
      status: errorStatus,
      data: error.response?.data,
    };

    if (onError) {
      onError(errorObject);
    } else {
      return { error: errorObject };
    }
  }
};

/**
 * Generic PATCH request handler (partial update)
 * @param {string} endpoint - API endpoint
 * @param {object} data - Request payload
 * @param {function} onSuccess - Callback on success
 * @param {function} onError - Callback on error
 */
export const apiPatch = async (endpoint, data, onSuccess, onError) => {
  try {
    const response = await api.patch(endpoint, data);
    if (onSuccess) {
      onSuccess(response.data);
    }
    return response.data;
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    const errorStatus = error.response?.status;

    const errorObject = {
      message: errorMessage,
      status: errorStatus,
      data: error.response?.data,
    };

    if (onError) {
      onError(errorObject);
    } else {
      return { error: errorObject };
    }
  }
};

/**
 * Generic DELETE request handler
 * @param {string} endpoint - API endpoint
 * @param {function} onSuccess - Callback on success
 * @param {function} onError - Callback on error
 */
export const apiDelete = async (endpoint, onSuccess, onError) => {
  try {
    const response = await api.delete(endpoint);
    if (onSuccess) {
      onSuccess(response.data);
    }
    return response.data;
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    const errorStatus = error.response?.status;

    const errorObject = {
      message: errorMessage,
      status: errorStatus,
      data: error.response?.data,
    };

    if (onError) {
      onError(errorObject);
    } else {
      return { error: errorObject };
    }
  }
};

/**
 * Generic POST request handler for FormData (multipart/form-data)
 * @param {string} endpoint - API endpoint
 * @param {FormData} data - FormData payload
 * @param {function} onSuccess - Callback on success
 * @param {function} onError - Callback on error
 */
export const apiPostFormData = async (endpoint, data, onSuccess, onError) => {
  try {
    const response = await api.post(endpoint, data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    if (onSuccess) {
      onSuccess(response.data);
    }
    return response.data;
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    const errorStatus = error.response?.status;

    const errorObject = {
      message: errorMessage,
      status: errorStatus,
      data: error.response?.data,
    };

    if (onError) {
      onError(errorObject);
    } else {
      return { error: errorObject };
    }
  }
};

export default api;
