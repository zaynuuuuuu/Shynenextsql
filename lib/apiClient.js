'use client';
import axios from 'axios';

const api = axios.create({
  // Same-origin now that the API lives inside this Next.js app — no separate
  // backend URL/CORS config needed like the old VITE_API_URL setup.
  baseURL: '/api',
});

// Attach JWT (from localStorage) to every request if present
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Global 401 handling — clear stale auth if token is invalid/expired
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    return Promise.reject(err);
  }
);

export default api;
