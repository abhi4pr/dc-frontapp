import axios from 'axios';
import { API_URL } from '../constants';

const api = axios.create({
  baseURL: API_URL || 'http://localhost:5000' // Replace with your API base URL
});

// Add a request interceptor to include the token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token'); // Retrieve token from localStorage
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
