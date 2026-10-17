/**
 * readerProgress.ts
 *
 * Tracks and restores reading progress (current page) per document.
 *
 * Strategy:
 *   1. Try the backend API (GET/POST /api/reading/progress/:documentId).
 *      The backend stores progress in-memory (keyed by JWT user) so it
 *      survives page refreshes within the same server session.
 *   2. Always also write to localStorage as a local fallback so progress
 *      survives even if the backend is down or the server restarts.
 *
 * Security: userId is NEVER sent from the frontend.
 *           The backend derives it from the JWT in the Authorization header,
 *           which is attached automatically by the Axios interceptor in api.ts.
 *
 * Phase 1 integration point:
 *   Replace the in-memory Map in reading.service.js with Prisma queries.
 *   This frontend file needs no changes.
 */

import api from "@/lib/api";

const LS_PREFIX = "readable_progress_";

export interface ReadingProgress {
  documentId: string;
  currentPage: number;
  totalPages: number;
  percentage: number;
  lastReadAt: string; // ISO 8601
}

// ---------------------------------------------------------------------------
// Get progress
// ---------------------------------------------------------------------------

/**
 * Retrieve the saved reading progress for a document.
 * Returns null if no progress has been saved yet.
 */
export async function getProgress(
  documentId: string
): Promise<ReadingProgress | null> {
  // 1. Try backend (authoritative, persists across devices)
  try {
    const res = await api.get<{
      success: boolean;
      data: ReadingProgress | null;
    }>(`/reading/progress/${documentId}`);
    if (res.data.success && res.data.data) {
      // Sync the result back to localStorage so fallback is up to date
      _saveLocal(documentId, res.data.data);
      return res.data.data;
    }
  } catch {
    // Backend unavailable — fall through to localStorage
  }

  // 2. Fall back to localStorage
  return _loadLocal(documentId);
}

// ---------------------------------------------------------------------------
// Get all progress for user
// ---------------------------------------------------------------------------

/**
 * Retrieve all saved reading progress records for the authenticated user.
 */
export async function getAllUserProgress(): Promise<Record<string, ReadingProgress>> {
  try {
    const res = await api.get<{
      success: boolean;
      data: Record<string, ReadingProgress>;
    }>("/reading/progress");
    if (res.data?.success && res.data?.data) {
      return res.data.data;
    }
  } catch {
    // Backend unavailable
  }
  return {};
}

// ---------------------------------------------------------------------------
// Save progress
// ---------------------------------------------------------------------------

/**
 * Save the current reading progress.
 * Writes to localStorage immediately (synchronous), then fires backend
 * request in the background (errors are silently ignored so they can
 * never disrupt the reading experience).
 */
export async function saveProgress(progress: ReadingProgress): Promise<void> {
  // Always save locally first — synchronous, safe
  _saveLocal(progress.documentId, progress);

  // Best-effort backend save
  try {
    await api.post(`/reading/progress/${progress.documentId}`, {
      currentPage: progress.currentPage,
      totalPages: progress.totalPages,
      percentage: progress.percentage,
      lastReadAt: progress.lastReadAt,
    });
  } catch {
    // Silently ignore — localStorage copy is already written
  }
}

// ---------------------------------------------------------------------------
// Local helpers
// ---------------------------------------------------------------------------

function _lsKey(documentId: string): string {
  return `${LS_PREFIX}${documentId}`;
}

function _loadLocal(documentId: string): ReadingProgress | null {
  try {
    const raw = localStorage.getItem(_lsKey(documentId));
    if (!raw) return null;
    return JSON.parse(raw) as ReadingProgress;
  } catch {
    return null;
  }
}

function _saveLocal(documentId: string, progress: ReadingProgress): void {
  try {
    localStorage.setItem(_lsKey(documentId), JSON.stringify(progress));
  } catch {
    // localStorage may be full or unavailable — fail silently
  }
}
