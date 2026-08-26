import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthError = error.response?.status === 401;
    const isLoginPage = window.location.pathname === '/dang-nhap';

    if (isAuthError && !isLoginPage) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      window.location.href = '/dang-nhap?expired=true';
    }

    return Promise.reject(error);
  }
);