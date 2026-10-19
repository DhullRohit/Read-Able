/**
 * bookmarks.tsx
 *
 * Standalone Bookmarks Route — /bookmarks
 * Lists every document the user owns: title, "Page N" or "Not started",
 * last read time, and an Open button jumping to /documents/:id/read?page=N.
 * Refetches automatically on tab focus (visibilitychange to visible).
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { createFileRoute, redirect, useNavigate, Link } from "@tanstack/react-router";
import { readingApi, documentApi, type BookmarkDocumentItem } from "@/lib/api";
import { Bookmark, BookOpen, ArrowLeft, Upload, Loader2, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/bookmarks")({
  beforeLoad: () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("readable_token") : null;
    if (!token) {
      throw redirect({ to: "/" });
    }
  },
  head: () => ({
    meta: [
      { title: "Bookmarks — ReadAble" },
      {
        name: "description",
        content: "View all your saved reading bookmarks and resume right where you left off.",
      },
    ],
  }),
  component: BookmarksPage,
});

function formatTimeAgo(dateString?: string): string {
  if (!dateString) return "Never read";
  const date = new Date(dateString);
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (isNaN(diffSec) || diffSec < 60) return "Just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

function BookmarksPage() {
  const navigate = useNavigate();
  const [bookmarks, setBookmarks] = useState<BookmarkDocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchBookmarks = useCallback(async () => {
    try {
      const res = await readingApi.getBookmarks();
      setBookmarks(res.data?.data || []);
      setError(null);
    } catch {
      setError("Failed to load bookmarks. Please try refreshing.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookmarks();
  }, [fetchBookmarks]);

  // Refetch when the browser tab regains focus
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchBookmarks();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", fetchBookmarks);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", fetchBookmarks);
    };
  }, [fetchBookmarks]);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      await documentApi.upload(file, file.name.replace(/\.[^/.]+$/, ""));
      await fetchBookmarks();
    } catch {
      setError("Failed to upload document.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const openDocument = (doc: BookmarkDocumentItem) => {
    const targetPage = doc.lastPage && doc.lastPage >= 1 ? doc.lastPage : 1;
    navigate({
      to: "/documents/$id/read",
      params: { id: String(doc.documentId) },
      search: { page: targetPage },
    });
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#FAF8F5",
        color: "#1D2321",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        style={{ display: "none" }}
        onChange={handleFileSelected}
      />

      {/* Top Navbar */}
      <header
        style={{
          borderBottom: "1px solid #E7E2DA",
          background: "#FFFFFF",
          padding: "14px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 20,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <Link
            to="/dashboard"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              color: "#2B8272",
              textDecoration: "none",
              fontSize: "0.875rem",
              fontWeight: 500,
              background: "#F0EDE6",
              padding: "6px 12px",
              borderRadius: 8,
            }}
          >
            <ArrowLeft size={16} />
            <span>Dashboard</span>
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: "rgba(43,130,114,0.1)",
                color: "#2B8272",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Bookmark size={18} />
            </div>
            <h1 style={{ fontSize: "1.125rem", fontWeight: 700, margin: 0 }}>
              Bookmarks
            </h1>
          </div>
        </div>

        <button
          onClick={handleUploadClick}
          disabled={uploading}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: "#2B8272",
            color: "#FFFFFF",
            border: "none",
            borderRadius: 8,
            padding: "8px 16px",
            fontSize: "0.8125rem",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {uploading ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
          <span>Upload Document</span>
        </button>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: 900, margin: "0 auto", padding: "32px 20px 60px" }}>
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 700, margin: "0 0 6px" }}>
            Reading Bookmarks
          </h2>
          <p style={{ color: "#66706D", fontSize: "0.875rem", margin: 0 }}>
            Every document in your library with your last saved reading spot.
          </p>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#66706D" }}>
            <div
              style={{
                width: 32,
                height: 32,
                border: "3px solid #ddd",
                borderTop: "3px solid #2B8272",
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
                margin: "0 auto 12px",
              }}
            />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            Loading bookmarks…
          </div>
        ) : error ? (
          <div
            style={{
              padding: 24,
              background: "#FFF",
              border: "1px solid #E7E2DA",
              borderRadius: 12,
              textAlign: "center",
              color: "#DC2626",
            }}
          >
            {error}
          </div>
        ) : bookmarks.length === 0 ? (
          /* Empty state for bookmarks */
          <div
            style={{
              background: "#FFFFFF",
              border: "1px solid #E7E2DA",
              borderRadius: 14,
              padding: "48px 24px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 16,
                background: "rgba(43,130,114,0.1)",
                color: "#2B8272",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
              }}
            >
              <Bookmark size={28} />
            </div>
            <h3 style={{ fontSize: "1.125rem", fontWeight: 600, margin: "0 0 8px" }}>
              No bookmarks yet
            </h3>
            <p style={{ color: "#66706D", fontSize: "0.875rem", maxWidth: 420, margin: "0 auto 20px" }}>
              No bookmarks yet. Open a document from My Library to start reading.
            </p>
            <Link
              to="/dashboard"
              style={{
                background: "#2B8272",
                color: "#FFFFFF",
                textDecoration: "none",
                borderRadius: 8,
                padding: "10px 20px",
                fontSize: "0.875rem",
                fontWeight: 600,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <BookOpen size={16} />
              <span>Go to My Library</span>
            </Link>
          </div>
        ) : (
          /* Documents List */
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {bookmarks.map((doc) => {
              const pageNumber = doc.lastPage && doc.lastPage >= 1 ? doc.lastPage : 1;
              return (
                <div
                  key={doc.documentId}
                  style={{
                    background: "#FFFFFF",
                    border: "1px solid #E7E2DA",
                    borderRadius: 12,
                    padding: "18px 20px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 16,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
                    transition: "transform 0.1s, box-shadow 0.1s",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 16, minWidth: 0 }}>
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 10,
                        background: "rgba(43,130,114,0.12)",
                        color: "#2B8272",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <BookOpen size={20} />
                    </div>

                    <div style={{ minWidth: 0 }}>
                      <h4
                        style={{
                          fontSize: "0.9375rem",
                          fontWeight: 600,
                          margin: "0 0 4px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {doc.title}
                      </h4>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          fontSize: "0.8125rem",
                          color: "#66706D",
                        }}
                      >
                        <span
                          style={{
                            fontWeight: 600,
                            color: "#2B8272",
                            background: "rgba(43,130,114,0.08)",
                            padding: "2px 8px",
                            borderRadius: 6,
                          }}
                        >
                          Page {pageNumber}
                        </span>
                        <span>•</span>
                        <span>Last read: {formatTimeAgo(doc.updatedAt)}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => openDocument(doc)}
                    style={{
                      background: "#2B8272",
                      color: "#FFFFFF",
                      border: "none",
                      borderRadius: 8,
                      padding: "8px 18px",
                      fontSize: "0.8125rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      flexShrink: 0,
                    }}
                  >
                    <span>Open</span>
                    <ExternalLink size={13} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
