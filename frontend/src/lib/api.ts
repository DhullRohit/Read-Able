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

  me: () => api.get("/auth/me"),
};

export interface DocumentItem {
  id: number;
  title: string;
  fileName: string;
  s3Key: string;
  fileSize: number;
  mimeType: string;
  userId: number;
  createdAt: string;
  updatedAt: string;
}

export const documentApi = {
  getAll: () => api.get<{ success: boolean; data: DocumentItem[] }>("/documents"),
  getById: (id: number) => api.get<{ success: boolean; data: DocumentItem }>(`/documents/${id}`),
  create: (data: { title: string; fileName?: string; fileSize?: number; mimeType?: string; s3Key?: string }) =>
    api.post<{ success: boolean; data: DocumentItem }>("/documents", data),
  update: (id: number, data: { title?: string; fileName?: string }) =>
    api.put<{ success: boolean; data: DocumentItem }>(`/documents/${id}`, data),
  delete: (id: number) => api.delete<{ success: boolean; data: { id: number } }>(`/documents/${id}`),
};

export default api;
