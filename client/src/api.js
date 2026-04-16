import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  withCredentials: true, // Needed if you use cookies later
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('rxflow_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

api.interceptors.response.use((response) => {
  return response;
}, (error) => {
  // Global network error handling
  if (!error.response) {
    console.error('Network Error - Cannot connect to server');
  }
  return Promise.reject(error);
});

export default api;
