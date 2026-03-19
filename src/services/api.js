// frontend/src/services/api.js
import axios from 'axios';

const API_BASE_URL = 'https://hrm.sportstech.team/api/';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add JWT token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    // Remove 'Bearer ' prefix if already present to avoid duplication
    const cleanToken = token.startsWith('Bearer ') ? token.substring(7) : token;
    config.headers.Authorization = `Bearer ${cleanToken}`;
  } else {
    console.warn('⚠️ No token found in localStorage');
  }
  return config;
});

export const authAPI = {
  login: (credentials) => api.post('/login/', credentials),
  // Add more endpoints as needed
};

export default api;
