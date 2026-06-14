import axios from 'axios';

const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const API = axios.create({ baseURL: `${apiBaseUrl}/api` });

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('nx_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('nx_token');
      localStorage.removeItem('nx_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default API;
