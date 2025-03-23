import axios from "axios";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "./constants";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(ACCESS_TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle 401 errors and refresh token if needed
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // If the error response is 401 (unauthorized)
    if (error.response && error.response.status === 401) {
      const originalRequest = error.config;
      // Prevent infinite retry loops
      if (!originalRequest._retry) {
        originalRequest._retry = true;
        try {
          // Retrieve the refresh token from localStorage
          const refreshToken = localStorage.getItem(REFRESH_TOKEN);
          // Call your refresh endpoint (adjust URL if needed)
          const response = await axios.post(
            `${import.meta.env.VITE_API_URL}/api/token/refresh/`,
            { refresh: refreshToken }
          );
          const newAccessToken = response.data.access;
          // Update the access token in localStorage
          localStorage.setItem(ACCESS_TOKEN, newAccessToken);
          // Update the original request's Authorization header
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          // Retry the original request
          return api(originalRequest);
        } catch (refreshError) {
          // If refresh fails, clear tokens and redirect to login
          localStorage.removeItem(ACCESS_TOKEN);
          localStorage.removeItem(REFRESH_TOKEN);
          window.location.href = "/login";
          return Promise.reject(refreshError);
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
