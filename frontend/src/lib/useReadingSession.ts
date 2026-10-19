/**
 * useReadingSession.ts
 *
 * Custom React hook managing the three auto-saved reading features:
 * 1. Bookmark autosave (lastPage) with keepalive flushing & ?page=N jump.
 * 2. Highlights with floating selection toolbar, color switching & deletion.
 * 3. Notes with 800ms debounced autosave, in-flight deduplication & status indicators.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import {
  readingApi,
  type HighlightRecord,
  type NoteRecord,
  type ReadingPayload,
} from "./api";

export interface LocalNoteItem extends NoteRecord {
  isDraft?: boolean;
  saveStatus?: "Saving..." | "Saved" | "Failed - retrying";
  pendingText?: string;
}

export function useReadingSession(
  documentId: string | number,
  totalPages: number = 1
) {
  const docIdStr = String(documentId);
  const totalPagesRef = useRef(totalPages);
  totalPagesRef.current = totalPages;

  const [initialLoaded, setInitialLoaded] = useState(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageInput, setPageInput] = useState<string>("1");

  // Highlights state: active highlight color mode (YELLOW, RED, ERASE, or OFF)
  const [highlightMode, setHighlightMode] = useState<"YELLOW" | "RED" | "ERASE" | "OFF">("YELLOW");
  const [highlights, setHighlights] = useState<HighlightRecord[]>([]);

  // Notes state
  const [notes, setNotes] = useState<LocalNoteItem[]>([]);
  const [notesPanelOpen, setNotesPanelOpen] = useState(false);

  // Floating toolbar for text selection (if used)
  const [selectionToolbar, setSelectionToolbar] = useState<{
    visible: boolean;
    x: number;
    y: number;
    text: string;
    rects: any;
    page: number;
  } | null>(null);

  // Popup for existing highlight clicked
  const [activeHighlightPopup, setActiveHighlightPopup] = useState<{
    highlight: HighlightRecord;
    x: number;
    y: number;
  } | null>(null);

  // Refs for bookmark sync and cancellation
  const isCancelledRef = useRef(false);
  const progressTimerRef = useRef<any>(null);
  const lastSavedPageRef = useRef<number | null>(null);
  const currentPageRef = useRef<number>(1);
  currentPageRef.current = currentPage;

  const inFlightNotePosts = useRef<Set<number | string>>(new Set());
  const noteDebounceTimers = useRef<Map<number | string, any>>(new Map());
  const pendingNotePatches = useRef<Map<number, string>>(new Map());

  const cancelAutosaves = useCallback(() => {
    isCancelledRef.current = true;
    if (progressTimerRef.current) {
      clearTimeout(progressTimerRef.current);
    }
    noteDebounceTimers.current.forEach((t) => clearTimeout(t));
    noteDebounceTimers.current.clear();
  }, []);

  // ---------------------------------------------------------------------------
  // 1. Initial Load: Source of truth via GET /reading
  // ---------------------------------------------------------------------------
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await readingApi.getReading(docIdStr);
        if (cancelled) return;

        const data: ReadingPayload = res.data?.data || {
          progress: null,
          notes: [],
          highlights: [],
        };

        // Determine starting page: ?page=N > progress.lastPage > 1
        const urlParams = new URLSearchParams(window.location.search);
        const queryPageStr = urlParams.get("page");
        let startPage = 1;

        if (queryPageStr) {
          const qp = parseInt(queryPageStr, 10);
          if (!isNaN(qp) && qp >= 1) {
            startPage = qp;
          }
        } else if (data.progress && data.progress.lastPage >= 1) {
          startPage = data.progress.lastPage;
        }

        setCurrentPage(startPage);
        setPageInput(String(startPage));
        lastSavedPageRef.current = startPage;

        // Upsert reading progress immediately on document open (Requirement 1)
        readingApi.putProgress(docIdStr, startPage).catch(() => {});

        setHighlights(data.highlights || []);
        setNotes(
          (data.notes || []).map((n) => ({
            ...n,
            saveStatus: "Saved",
          }))
        );
      } catch (err) {
        // Fallback gracefully on new documents or error
        if (!cancelled) {
          setCurrentPage(1);
          setPageInput("1");
          lastSavedPageRef.current = 1;
          setHighlights([]);
          setNotes([]);
        }
      } finally {
        if (!cancelled) {
          setInitialLoaded(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [docIdStr]);

  // ---------------------------------------------------------------------------
  // 2. Bookmark Autosave & Keepalive Flushing
  // ---------------------------------------------------------------------------
  const flushBookmark = useCallback(() => {
    if (isCancelledRef.current) return;
    const pageToSave = currentPageRef.current;
    if (pageToSave <= 0 || pageToSave === lastSavedPageRef.current) return;

    lastSavedPageRef.current = pageToSave;
    const token = typeof window !== "undefined" ? localStorage.getItem("readable_token") : null;

    try {
      fetch(`/api/documents/${docIdStr}/progress`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ lastPage: pageToSave }),
        keepalive: true,
      }).catch(() => {});
    } catch {
      // Ignore background keepalive errors
    }
  }, [docIdStr]);

  // Debounced autosave (~1s) when page changes
  useEffect(() => {
    if (!initialLoaded) return;
    if (currentPage === lastSavedPageRef.current) return;
    if (isCancelledRef.current) return;

    progressTimerRef.current = setTimeout(async () => {
      if (isCancelledRef.current) return;
      try {
        await readingApi.putProgress(docIdStr, currentPage);
        lastSavedPageRef.current = currentPage;
      } catch {
        // Will retry or flush on exit (ignore 404s quietly)
      }
    }, 1000);

    return () => {
      if (progressTimerRef.current) clearTimeout(progressTimerRef.current);
    };
  }, [currentPage, docIdStr, initialLoaded]);

  // Flush on visibilitychange, pagehide, and unmount
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        flushBookmark();
      }
    };

    const handlePageHide = () => {
      flushBookmark();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", handlePageHide);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handlePageHide);
      flushBookmark();
    };
  }, [flushBookmark]);

  // Page navigation helpers
  const goToPage = useCallback(
    (page: number) => {
      const maxPage =
        totalPagesRef.current && totalPagesRef.current > 1
          ? totalPagesRef.current
          : Math.max(1, totalPages || 1);
      if (isNaN(page) || page < 1) return;
      const target = Math.max(1, Math.min(page, maxPage));

      setCurrentPage(target);
      setPageInput(String(target));
      setActiveHighlightPopup(null);
      setSelectionToolbar(null);

      // Update URL ?page=N without reloading
      try {
        const url = new URL(window.location.href);
        url.searchParams.set("page", String(target));
        window.history.replaceState(null, "", url.toString());
      } catch {
        // Ignore in non-browser contexts
      }

      // Autosave bookmark immediately on jump
      lastSavedPageRef.current = target;
      readingApi.putProgress(docIdStr, target).catch(() => {});
    },
    [totalPages, docIdStr]
  );

  const nextPage = useCallback(() => {
    goToPage(currentPage + 1);
  }, [currentPage, goToPage]);

  const prevPage = useCallback(() => {
    goToPage(currentPage - 1);
  }, [currentPage, goToPage]);

  // ---------------------------------------------------------------------------
  // 3. Highlights
  // ---------------------------------------------------------------------------
  const saveHighlightDirect = useCallback(
    async (
      color: "RED" | "YELLOW",
      payload: { text: string; rects: { start: number; end: number }; page: number }
    ) => {
      if (isCancelledRef.current) return;
      if (!payload.text || !payload.text.trim()) return;

      const { text, rects, page } = payload;
      window.getSelection()?.removeAllRanges();

      // Avoid duplicates
      const isDuplicate = highlights.some(
        (h) =>
          h.page === page &&
          h.rects &&
          typeof h.rects === "object" &&
          h.rects.start === rects.start &&
          h.rects.end === rects.end
      );
      if (isDuplicate) return;

      // Optimistic highlight addition
      const tempId = -Date.now();
      const optimisticHighlight: HighlightRecord = {
        id: tempId,
        page,
        color,
        text,
        rects,
        createdAt: new Date().toISOString(),
        userId: 0,
        documentId: Number(docIdStr),
      };

      setHighlights((prev) => [...prev, optimisticHighlight]);

      try {
        const res = await readingApi.createHighlight(docIdStr, {
          page,
          color,
          text,
          rects,
        });
        if (res.data?.data) {
          setHighlights((prev) =>
            prev.map((h) => (h.id === tempId ? res.data.data : h))
          );
        }
      } catch (err: any) {
        if (err?.response?.status !== 404) {
          // Revert on failure
          setHighlights((prev) => prev.filter((h) => h.id !== tempId));
        }
      }
    },
    [highlights, docIdStr]
  );

  const saveHighlight = useCallback(
    async (color: "RED" | "YELLOW") => {
      if (!selectionToolbar || !selectionToolbar.text.trim()) return;

      const { text, rects, page } = selectionToolbar;
      setSelectionToolbar(null);
      await saveHighlightDirect(color, { text, rects, page });
    },
    [selectionToolbar, saveHighlightDirect]
  );

  const updateHighlightColor = useCallback(
    async (highlightId: number, newColor: "RED" | "YELLOW") => {
      setActiveHighlightPopup(null);
      setHighlights((prev) =>
        prev.map((h) => (h.id === highlightId ? { ...h, color: newColor } : h))
      );

      try {
        await readingApi.updateHighlight(docIdStr, highlightId, newColor);
      } catch (err: any) {
        if (err?.response?.status !== 404) {
          // Rollback
          setHighlights((prev) =>
            prev.map((h) =>
              h.id === highlightId
                ? { ...h, color: newColor === "RED" ? "YELLOW" : "RED" }
                : h
            )
          );
        }
      }
    },
    [docIdStr]
  );

  const deleteHighlight = useCallback(
    async (highlightId: number) => {
      setActiveHighlightPopup(null);
      const prevList = highlights;
      setHighlights((prev) => prev.filter((h) => h.id !== highlightId));

      try {
        await readingApi.deleteHighlight(docIdStr, highlightId);
      } catch (err: any) {
        if (err?.response?.status !== 404) {
          setHighlights(prevList);
          throw err;
        }
      }
    },
    [docIdStr, highlights]
  );

  const deleteHighlightsBatch = useCallback(
    async (idsToDelete: number[]) => {
      if (!idsToDelete || idsToDelete.length === 0) return;
      setActiveHighlightPopup(null);
      const prevList = highlights;
      const idsSet = new Set(idsToDelete);
      setHighlights((prev) => prev.filter((h) => !idsSet.has(h.id)));

      try {
        await readingApi.deleteHighlights(docIdStr, idsToDelete);
      } catch (err: any) {
        if (err?.response?.status !== 404) {
          setHighlights(prevList);
          throw err;
        }
      }
    },
    [docIdStr, highlights]
  );

  // ---------------------------------------------------------------------------
  // 4. Notes with 800ms debounced autosave, in-flight lock & keepalive flush
  // ---------------------------------------------------------------------------
  const addDraftNote = useCallback(() => {
    setNotesPanelOpen(true);
    const tempId = -Date.now();
    const newNote: LocalNoteItem = {
      id: tempId,
      page: currentPage,
      content: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId: 0,
      documentId: Number(docIdStr),
      isDraft: true,
      saveStatus: "Saved",
    };
    setNotes((prev) => [newNote, ...prev]);
  }, [currentPage, docIdStr]);

  const updateNoteContent = useCallback(
    (noteId: number, content: string) => {
      setNotes((prev) =>
        prev.map((n) =>
          n.id === noteId
            ? { ...n, content, saveStatus: "Saving...", pendingText: content }
            : n
        )
      );

      // Clear existing debounce timer for this note
      const existingTimer = noteDebounceTimers.current.get(noteId);
      if (existingTimer) clearTimeout(existingTimer);

      const timer = setTimeout(async () => {
        noteDebounceTimers.current.delete(noteId);

        const currentNote = notes.find((n) => n.id === noteId);
        const textToSave = content.trim();

        // Never save empty new notes
        if (noteId < 0 && !textToSave) {
          setNotes((prev) =>
            prev.map((n) =>
              n.id === noteId ? { ...n, saveStatus: "Saved" } : n
            )
          );
          return;
        }

        // If it's a draft note (< 0) and not currently posting:
        if (noteId < 0) {
          if (inFlightNotePosts.current.has(noteId)) return;
          inFlightNotePosts.current.add(noteId);

          try {
            const res = await readingApi.createNote(docIdStr, {
              page: currentNote?.page || currentPage,
              content: textToSave,
            });

            inFlightNotePosts.current.delete(noteId);
            const savedNote = res.data?.data;
            if (savedNote) {
              setNotes((prev) =>
                prev.map((n) =>
                  n.id === noteId
                    ? {
                        ...savedNote,
                        isDraft: false,
                        saveStatus: "Saved",
                        pendingText: undefined,
                      }
                    : n
                )
              );

              // If more text was typed while POST was in flight, trigger patch
              const queuedText = pendingNotePatches.current.get(noteId);
              if (queuedText !== undefined && queuedText !== textToSave) {
                pendingNotePatches.current.delete(noteId);
                updateNoteContent(savedNote.id, queuedText);
              }
            }
          } catch {
            inFlightNotePosts.current.delete(noteId);
            setNotes((prev) =>
              prev.map((n) =>
                n.id === noteId ? { ...n, saveStatus: "Failed - retrying" } : n
              )
            );
          }
        } else {
          // Existing note: PATCH
          try {
            const res = await readingApi.updateNote(docIdStr, noteId, {
              content: textToSave,
            });
            if (res.data?.data) {
              setNotes((prev) =>
                prev.map((n) =>
                  n.id === noteId
                    ? {
                        ...n,
                        content: res.data.data.content,
                        saveStatus: "Saved",
                        pendingText: undefined,
                      }
                    : n
                )
              );
            }
          } catch {
            setNotes((prev) =>
              prev.map((n) =>
                n.id === noteId ? { ...n, saveStatus: "Failed - retrying" } : n
              )
            );
          }
        }
      }, 800);

      noteDebounceTimers.current.set(noteId, timer);
    },
    [docIdStr, currentPage, notes]
  );

  const deleteNote = useCallback(
    async (noteId: number) => {
      // Clear timer
      const timer = noteDebounceTimers.current.get(noteId);
      if (timer) clearTimeout(timer);
      noteDebounceTimers.current.delete(noteId);

      // Remove from UI immediately
      setNotes((prev) => prev.filter((n) => n.id !== noteId));

      if (noteId > 0) {
        try {
          await readingApi.deleteNote(docIdStr, noteId);
        } catch {
          // Error handling
        }
      }
    },
    [docIdStr]
  );

  const flushNote = useCallback(
    (noteId: number) => {
      const note = notes.find((n) => n.id === noteId);
      if (!note) return;

      const trimmed = note.content.trim();
      // Remove empty draft notes
      if (noteId < 0 && !trimmed) {
        setNotes((prev) => prev.filter((n) => n.id !== noteId));
        return;
      }

      if (note.saveStatus === "Saving..." || note.pendingText) {
        const timer = noteDebounceTimers.current.get(noteId);
        if (timer) {
          clearTimeout(timer);
          noteDebounceTimers.current.delete(noteId);
        }

        const token =
          typeof window !== "undefined"
            ? localStorage.getItem("readable_token")
            : null;

        if (noteId > 0) {
          // Flush PATCH
          fetch(`/api/documents/${docIdStr}/notes/${noteId}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({ content: trimmed }),
            keepalive: true,
          }).catch(() => {});
        } else if (trimmed) {
          // Flush POST
          fetch(`/api/documents/${docIdStr}/notes`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({ page: note.page || currentPage, content: trimmed }),
            keepalive: true,
          }).catch(() => {});
        }
      }
    },
    [notes, docIdStr, currentPage]
  );

  return {
    initialLoaded,
    currentPage,
    setCurrentPage,
    pageInput,
    setPageInput,
    goToPage,
    nextPage,
    prevPage,
    flushBookmark,
    cancelAutosaves,
    // Highlights
    highlightMode,
    setHighlightMode,
    highlights,
    saveHighlight,
    saveHighlightDirect,
    updateHighlightColor,
    deleteHighlight,
    deleteHighlightsBatch,
    selectionToolbar,
    setSelectionToolbar,
    activeHighlightPopup,
    setActiveHighlightPopup,
    // Notes
    notes,
    notesPanelOpen,
    setNotesPanelOpen,
    addDraftNote,
    updateNoteContent,
    deleteNote,
    flushNote,
  };
}
