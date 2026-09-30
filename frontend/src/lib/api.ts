// Centralized API client for all backend calls
import axios from "axios";

const api = axios.create({
  baseURL: "/api",
});

// Attach JWT token automatically from localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("readable_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const authApi = {
  register: (data: { name: string; email?: string; phone?: string; password: string }) =>
    api.post("/auth/register", data),

  login: (data: { email?: string; phone?: string; password: string }) =>
    api.post("/auth/login", data),

  me: () => api.get("/auth/me"),
};

export default api;
