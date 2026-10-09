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
  register: (data: { name: string; email: string; phone: string; password: string }) =>
    api.post("/auth/register", data),

  login: (data: { identifier?: string; email?: string; phone?: string; password: string }) =>
    api.post("/auth/login", data),

  me: async () => {
    try {
      return await api.get("/auth/me");
    } catch (err) {
      const token = localStorage.getItem("readable_token");
      const savedUser = localStorage.getItem("readable_user");
      if (token && savedUser) {
        try {
          return { data: { data: JSON.parse(savedUser) } };
        } catch {
          // fallback to rethrowing err
        }
      }
      throw err;
    }
  },
};

export default api;
