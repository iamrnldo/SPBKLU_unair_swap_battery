import axios from 'axios';

// Create custom Axios instance for user mobile client
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://192.168.1.154:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor to inject User's JWT Bearer Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('spbklu_user_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Redirect to login if token gets invalidated or expired
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      localStorage.removeItem('spbklu_user_token');
      localStorage.removeItem('spbklu_user_data');
      localStorage.removeItem('spbklu_active_charging_session');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
