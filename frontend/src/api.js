import axios from "axios";

// In dev: Vite proxy forwards /api → http://localhost:5000
// In prod: use /_/backend/api or VITE_API_URL env variable
const getAPIBase = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // On Vercel production
  if (window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
    return "/_/backend/api";
  }
  
  // Local development
  return "/api";
};

const API_BASE = getAPIBase();
console.log("🔗 API Base URL:", API_BASE);

const api = axios.create({
  baseURL: API_BASE,
});

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401/403 globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/";
    }
    return Promise.reject(error);
  }
);

export default api;
