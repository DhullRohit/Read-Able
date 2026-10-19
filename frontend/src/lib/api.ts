
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
  register: (data: {
    name: string;
    email: string;
    phone: string;
    password: string;
  }) => api.post("/auth/register", data),

  login: (data: {
    identifier?: string;
    email?: string;
    phone?: string;
    password: string;
  }) => api.post("/auth/login", data),

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
  contentHash?: string | null;
  lastUploadedAt?: string;
  duplicate?: boolean;
  createdAt: string;
  updatedAt: string;
}

export const documentApi = {
  getAll: () =>
    api.get<{ success: boolean; data: DocumentItem[] }>("/documents"),

  getById: (id: number) =>
    api.get<{ success: boolean; data: DocumentItem }>(`/documents/${id}`),

  // Existing JSON metadata creation; preserved for compatibility
  create: (data: {
    title: string;
    fileName?: string;
    fileSize?: number;
    mimeType?: string;
    s3Key?: string;
  }) =>
    api.post<{ success: boolean; data: DocumentItem }>("/documents", data),

  // Upload the actual file using multipart/form-data
  upload: (file: File, title?: string) => {
    const formData = new FormData();
    formData.append("file", file);

    if (title?.trim()) {
      formData.append("title", title.trim());
    }

    return api.post<{ success: boolean; data: DocumentItem }>(
      "/documents",
      formData
    );
  },
  getStream: (id: number) =>
    api.get<Blob>(`/documents/${id}/stream`, {
      responseType: "blob",
    }),

  getContent: (id: number) =>
    api.get<{
      success: boolean;
      data: {
        documentId: number;
        title: string;
        fileName: string;
        status: string;
        totalPages: number;
        pages: Array<{
          pageNumber: number;
          text: string;
          paragraphs: string[];
        }>;
      };
    }>(`/documents/${id}/content`),

  update: (id: number, data: { title?: string; fileName?: string }) =>
    api.put<{ success: boolean; data: DocumentItem }>(
      `/documents/${id}`,
      data
    ),

  delete: (id: number) =>
    api.delete<{ success: boolean; data: { id: number } }>(
      `/documents/${id}`
    ),
};

export interface ReadingProgressData {
  documentId: string;
  currentPage: number;
  totalPages: number;
  percentage: number;
  lastReadAt: string;
}

export interface ReadingProgressRecord {
  id: number;
  lastPage: number;
  updatedAt: string;
  userId: number;
  documentId: number;
}

export interface NoteRecord {
  id: number;
  page: number | null;
  content: string;
  createdAt: string;
  updatedAt: string;
  userId: number;
  documentId: number;
}

export interface HighlightRecord {
  id: number;
  page: number;
  color: "RED" | "YELLOW";
  text: string;
  rects: any;
  createdAt: string;
  userId: number;
  documentId: number;
}

export interface ReadingPayload {
  progress: ReadingProgressRecord | null;
  notes: NoteRecord[];
  highlights: HighlightRecord[];
}

export interface RecentDocumentItem {
  documentId: number;
  title: string;
  fileName: string;
  lastPage: number;
  updatedAt: string;
}

export interface BookmarkDocumentItem {
  documentId: number;
  title: string;
  fileName: string;
  lastPage: number | null;
  updatedAt: string;
}

export interface DocumentWithNotes {
  documentId: number;
  title: string;
  notes: Array<{
    id: number;
    page: number | null;
    content: string;
    createdAt: string;
  }>;
}

export const readingApi = {
  getProgress: (documentId: string | number) =>
    api.get<{ success: boolean; data: ReadingProgressData | null }>(
      `/reading/progress/${documentId}`
    ),

  saveProgress: (
    documentId: string | number,
    data: { currentPage: number; totalPages?: number; lastReadAt?: string }
  ) =>
    api.post<{ success: boolean; data: ReadingProgressData }>(
      `/reading/progress/${documentId}`,
      data
    ),

  getAllProgress: () =>
    api.get<{ success: boolean; data: Record<string, ReadingProgressData> }>(
      "/reading/progress"
    ),

  // Phase 3 Reading Features
  getReading: (documentId: string | number) =>
    api.get<{ success: boolean; data: ReadingPayload }>(
      `/documents/${documentId}/reading`,
      { headers: { "Cache-Control": "no-store" } }
    ),

  putProgress: (documentId: string | number, lastPage: number) =>
    api.put<{ success: boolean; data: ReadingProgressRecord }>(
      `/documents/${documentId}/progress`,
      { lastPage }
    ),

  createNote: (
    documentId: string | number,
    data: { page?: number | null; content: string }
  ) =>
    api.post<{ success: boolean; data: NoteRecord }>(
      `/documents/${documentId}/notes`,
      data
    ),

  updateNote: (
    documentId: string | number,
    noteId: number,
    data: { content?: string; page?: number | null }
  ) =>
    api.patch<{ success: boolean; data: NoteRecord }>(
      `/documents/${documentId}/notes/${noteId}`,
      data
    ),

  deleteNote: (documentId: string | number, noteId: number) =>
    api.delete<{ success: boolean; data: NoteRecord }>(
      `/documents/${documentId}/notes/${noteId}`
    ),

  createHighlight: (
    documentId: string | number,
    data: { page: number; color: "RED" | "YELLOW"; text: string; rects: any }
  ) =>
    api.post<{ success: boolean; data: HighlightRecord }>(
      `/documents/${documentId}/highlights`,
      data
    ),

  updateHighlight: (
    documentId: string | number,
    highlightId: number,
    color: "RED" | "YELLOW"
  ) =>
    api.patch<{ success: boolean; data: HighlightRecord }>(
      `/documents/${documentId}/highlights/${highlightId}`,
      { color }
    ),

  deleteHighlight: (documentId: string | number, highlightId: number) =>
    api.delete<{ success: boolean; data: HighlightRecord }>(
      `/documents/${documentId}/highlights/${highlightId}`
    ),

  deleteHighlights: (documentId: string | number, ids: number[]) =>
    api.delete<{ success: boolean; data: { count: number } }>(
      `/documents/${documentId}/highlights`,
      { data: { ids } }
    ),

  getRecent: () =>
    api.get<{ success: boolean; data: RecentDocumentItem[] }>(
      "/reading/recent"
    ),

  getBookmarks: () =>
    api.get<{ success: boolean; data: BookmarkDocumentItem[] }>(
      "/reading/bookmarks"
    ),

  getNotes: () =>
    api.get<{ success: boolean; data: DocumentWithNotes[] }>(
      "/reading/notes"
    ),
};

export default api;