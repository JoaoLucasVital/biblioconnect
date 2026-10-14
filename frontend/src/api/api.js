import axios from "axios";

const api = axios.create({
  timeout: 30000,
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
  withCredentials: true,
});

let csrfToken = null;
api.setCsrfToken = value => { csrfToken = value; };
api.interceptors.request.use((config) => {
  if (csrfToken && !["get", "head", "options"].includes((config.method || "get").toLowerCase())) {
    config.headers["X-CSRF-Token"] = csrfToken;
  }
  return config;
});

export default api;
