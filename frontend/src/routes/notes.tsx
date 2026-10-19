/**
 * notes.tsx
 *
 * Standalone Notes Route — /notes
 * Lists every document that has notes, grouped by document, each note
 * with page and date. Keeps add/edit/delete capabilities.
 * Navigating to a note opens the viewer in the SAME tab at ?page=N.
 * Refetches on tab focus (visibilitychange to visible).
 */

import { useState, useEffect, useCallback } from "react";
import { createFileRoute, redirect, useNavigate, Link } from "@tanstack/react-router";
import { readingApi, type DocumentWithNotes } from "@/lib/api";
import { StickyNote, ArrowLeft, BookOpen, Trash2, Edit3, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/notes")({
  beforeLoad: () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("readable_token") : null;
    if (!token) {
      throw redirect({ to: "/" });
    }
  },
  head: () => ({
    meta: [
      { title: "Notes — ReadAble" },
      {
        name: "description",
        content: "View, edit, and organize all your notes taken across documents.",
      },
    ],
  }),
  component: NotesPage,
});

function formatDate(dateStr?: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function NotesPage() {
  const navigate = useNavigate();
  const [docNotesList, setDocNotesList] = useState<DocumentWithNotes[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // In-line editing state
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [savingNoteId, setSavingNoteId] = useState<number | null>(null);

  const fetchNotes = useCallback(async () => {
    try {
      const res = await readingApi.getNotes();
      setDocNotesList(res.data?.data || []);
      setError(null);
    } catch {
      setError("Failed to load notes. Please try refreshing.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  // Refetch when tab regains focus
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchNotes();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", fetchNotes);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", fetchNotes);
    };
  }, [fetchNotes]);

  const handleStartEdit = (noteId: number, currentContent: string) => {
    setEditingNoteId(noteId);
    setEditText(currentContent);
  };

  const handleCancelEdit = () => {
    setEditingNoteId(null);
    setEditText("");
  };

  const handleSaveEdit = async (docId: number, noteId: number) => {
    if (!editText.trim()) return;
    try {
      setSavingNoteId(noteId);
      await readingApi.updateNote(docId, noteId, { content: editText.trim() });
      setDocNotesList((prev) =>
        prev.map((doc) =>
          doc.documentId === docId
            ? {
                ...doc,
                notes: doc.notes.map((n) =>
                  n.id === noteId ? { ...n, content: editText.trim() } : n
                ),
              }
            : doc
        )
      );
      setEditingNoteId(null);
      setEditText("");
    } catch {
      alert("Failed to update note.");
    } finally {
      setSavingNoteId(null);
    }
  };

  const handleDeleteNote = async (docId: number, noteId: number) => {
    if (!window.confirm("Are you sure you want to delete this note?")) return;
    try {
      await readingApi.deleteNote(docId, noteId);
      setDocNotesList((prev) =>
        prev
          .map((doc) =>
            doc.documentId === docId
              ? {
                  ...doc,
                  notes: doc.notes.filter((n) => n.id !== noteId),
                }
              : doc
          )
          .filter((doc) => doc.notes.length > 0)
      );
    } catch {
      alert("Failed to delete note.");
    }
  };

  const openDocumentAtPage = (docId: number, page?: number | null) => {
    const targetPage = page && page >= 1 ? page : 1;
    navigate({
      to: "/documents/$id/read",
      params: { id: String(docId) },
      search: { page: targetPage },
    });
  };

  const totalNotesCount = docNotesList.reduce((acc, d) => acc + d.notes.length, 0);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#FAF8F5",
        color: "#1D2321",
        fontFamily: "'Inter', sans-serif",
      }}
    >
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
              <StickyNote size={18} />
            </div>
            <h1 style={{ fontSize: "1.125rem", fontWeight: 700, margin: 0 }}>
              Notes
            </h1>
          </div>
        </div>

        <span
          style={{
            fontSize: "0.8125rem",
            color: "#66706D",
            fontWeight: 500,
          }}
        >
          {totalNotesCount} {totalNotesCount === 1 ? "note" : "notes"} in total
        </span>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: 900, margin: "0 auto", padding: "32px 20px 60px" }}>
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 700, margin: "0 0 6px" }}>
            All Notes
          </h2>
          <p style={{ color: "#66706D", fontSize: "0.875rem", margin: 0 }}>
            Notes you've taken across all your documents, organized by book.
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
            Loading notes…
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
        ) : docNotesList.length === 0 ? (
          /* Empty state for user with no notes */
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
              <StickyNote size={28} />
            </div>
            <h3 style={{ fontSize: "1.125rem", fontWeight: 600, margin: "0 0 8px" }}>
              No notes yet
            </h3>
            <p style={{ color: "#66706D", fontSize: "0.875rem", maxWidth: 440, margin: "0 auto 20px" }}>
              No notes yet. Open a document and add a note while reading.
            </p>
            <a
              href="/dashboard"
              style={{
                background: "#2B8272",
                color: "#FFFFFF",
                textDecoration: "none",
                borderRadius: 8,
                padding: "10px 20px",
                fontSize: "0.875rem",
                fontWeight: 600,
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <BookOpen size={16} />
              <span>My Library</span>
            </a>
          </div>
        ) : (
          /* Document Groups */
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {docNotesList.map((doc) => (
              <div
                key={doc.documentId}
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #E7E2DA",
                  borderRadius: 14,
                  overflow: "hidden",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
                }}
              >
                {/* Document Group Header */}
                <div
                  style={{
                    padding: "14px 20px",
                    background: "#FAF8F5",
                    borderBottom: "1px solid #E7E2DA",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <BookOpen size={18} color="#2B8272" />
                    <h3 style={{ fontSize: "1rem", fontWeight: 600, margin: 0 }}>
                      {doc.title}
                    </h3>
                    <span
                      style={{
                        fontSize: "0.75rem",
                        background: "#E7E2DA",
                        padding: "2px 8px",
                        borderRadius: 10,
                        fontWeight: 600,
                        color: "#66706D",
                      }}
                    >
                      {doc.notes.length}
                    </span>
                  </div>

                  <button
                    onClick={() => openDocumentAtPage(doc.documentId, doc.notes[0]?.page)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#2B8272",
                      fontSize: "0.8125rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <span>Open in reader</span>
                    <ExternalLink size={13} />
                  </button>
                </div>

                {/* Notes in this document */}
                <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
                  {doc.notes.map((note) => {
                    const isEditing = editingNoteId === note.id;

                    return (
                      <div
                        key={note.id}
                        style={{
                          border: "1px solid #E7E2DA",
                          borderRadius: 10,
                          padding: "14px 16px",
                          background: "#FFFFFF",
                          display: "flex",
                          flexDirection: "column",
                          gap: 10,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            fontSize: "0.75rem",
                            color: "#66706D",
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => openDocumentAtPage(doc.documentId, note.page)}
                            style={{
                              background: "rgba(43,130,114,0.08)",
                              color: "#2B8272",
                              border: "none",
                              borderRadius: 6,
                              padding: "3px 8px",
                              fontWeight: 600,
                              fontSize: "0.75rem",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                            }}
                          >
                            <span>{note.page ? `Page ${note.page}` : "General Note"}</span>
                            <ExternalLink size={11} />
                          </button>

                          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <span>{formatDate(note.createdAt)}</span>
                            {!isEditing && (
                              <button
                                type="button"
                                onClick={() => handleStartEdit(note.id, note.content)}
                                title="Edit note"
                                style={{
                                  background: "none",
                                  border: "none",
                                  color: "#66706D",
                                  cursor: "pointer",
                                  padding: 0,
                                }}
                              >
                                <Edit3 size={14} />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleDeleteNote(doc.documentId, note.id)}
                              title="Delete note"
                              style={{
                                background: "none",
                                border: "none",
                                color: "#DC2626",
                                cursor: "pointer",
                                padding: 0,
                              }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>

                        {isEditing ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            <textarea
                              value={editText}
                              onChange={(e) => setEditText(e.target.value)}
                              rows={3}
                              style={{
                                width: "100%",
                                padding: "8px 10px",
                                border: "1px solid #2B8272",
                                borderRadius: 6,
                                fontSize: "0.875rem",
                                lineHeight: 1.5,
                                outline: "none",
                                fontFamily: "inherit",
                                boxSizing: "border-box",
                              }}
                            />
                            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                              <button
                                type="button"
                                onClick={handleCancelEdit}
                                style={{
                                  background: "#F0EDE6",
                                  border: "1px solid #E7E2DA",
                                  borderRadius: 6,
                                  padding: "5px 12px",
                                  fontSize: "0.75rem",
                                  fontWeight: 600,
                                  cursor: "pointer",
                                }}
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSaveEdit(doc.documentId, note.id)}
                                disabled={savingNoteId === note.id || !editText.trim()}
                                style={{
                                  background: "#2B8272",
                                  color: "#FFFFFF",
                                  border: "none",
                                  borderRadius: 6,
                                  padding: "5px 14px",
                                  fontSize: "0.75rem",
                                  fontWeight: 600,
                                  cursor: "pointer",
                                }}
                              >
                                {savingNoteId === note.id ? "Saving…" : "Save"}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p
                            style={{
                              margin: 0,
                              fontSize: "0.875rem",
                              lineHeight: 1.6,
                              whiteSpace: "pre-wrap",
                              color: "#1D2321",
                            }}
                          >
                            {note.content}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
