/**
 * reading.service.js
 *
 * Business logic and data abstraction for reading session tracking and progress.
 *
 * Schema-Frozen Architecture:
 * The database schema is intentionally frozen (no ReadingProgress Prisma model).
 * To respect this constraint while delivering full Phase 3 functionality, this
 * service provides a clean Repository/Service interface backed by an in-memory
 * store.
 *
 * Future Migration Point:
 * When schema changes are unlocked, replace the in-memory map calls in this file
 * with `prisma.readingProgress.upsert(...)` and `prisma.readingProgress.findUnique(...)`.
 * The controllers, routes, and frontend will require zero changes.
 */

// Storage: Map<userId (string), Map<documentId (string), ReadingProgressRecord>>
const userProgressStore = new Map();

/**
 * @typedef {Object} ReadingProgressRecord
 * @property {string} documentId
 * @property {number} currentPage
 * @property {number} totalPages
 * @property {number} percentage
 * @property {string} lastReadAt ISO 8601 string
 */

/**
 * Safely calculates completion percentage between 0 and 100.
 *
 * @param {number} current
 * @param {number} total
 * @returns {number}
 */
export function calculateProgressPercentage(current, total) {
  if (typeof current !== "number" || typeof total !== "number" || total <= 0 || current <= 0) {
    return 0;
  }
  const pct = Math.round((current / total) * 100);
  return Math.min(100, Math.max(0, pct));
}

export const readingProgressService = {
  /**
   * Retrieves reading progress for a user and document.
   *
   * @param {number|string} userId
   * @param {number|string} documentId
   * @returns {ReadingProgressRecord|null}
   */
  getProgress(userId, documentId) {
    const uKey = String(userId);
    const dKey = String(documentId);

    const docMap = userProgressStore.get(uKey);
    if (!docMap) return null;

    return docMap.get(dKey) || null;
  },

  /**
   * Saves or updates reading progress for a user and document.
   *
   * @param {number|string} userId
   * @param {number|string} documentId
   * @param {Object} data
   * @param {number} data.currentPage
   * @param {number} [data.totalPages]
   * @param {string} [data.lastReadAt]
   * @returns {ReadingProgressRecord}
   */
  saveProgress(userId, documentId, { currentPage, totalPages = 0, lastReadAt }) {
    const uKey = String(userId);
    const dKey = String(documentId);

    if (!userProgressStore.has(uKey)) {
      userProgressStore.set(uKey, new Map());
    }

    const docMap = userProgressStore.get(uKey);
    const existing = docMap.get(dKey);

    const finalTotalPages =
      typeof totalPages === "number" && totalPages > 0
        ? totalPages
        : existing?.totalPages || 0;

    const percentage = calculateProgressPercentage(currentPage, finalTotalPages);

    const record = {
      documentId: dKey,
      currentPage: Math.max(1, currentPage),
      totalPages: finalTotalPages,
      percentage,
      lastReadAt: typeof lastReadAt === "string" ? lastReadAt : new Date().toISOString(),
    };

    docMap.set(dKey, record);
    return record;
  },

  /**
   * Retrieves all reading progress records for a user.
   *
   * @param {number|string} userId
   * @returns {Record<string, ReadingProgressRecord>}
   */
  getAllProgressForUser(userId) {
    const uKey = String(userId);
    const docMap = userProgressStore.get(uKey);
    if (!docMap) return {};

    const result = {};
    for (const [docId, record] of docMap.entries()) {
      result[docId] = record;
    }
    return result;
  },

  /**
   * Clears reading progress for a user's document (e.g. upon document deletion).
   *
   * @param {number|string} userId
   * @param {number|string} documentId
   */
  clearProgress(userId, documentId) {
    const uKey = String(userId);
    const dKey = String(documentId);
    const docMap = userProgressStore.get(uKey);
    if (docMap) {
      docMap.delete(dKey);
    }
  },

  /**
   * Test-only helper to reset in-memory state.
   */
  _resetStore() {
    userProgressStore.clear();
  },
};

export default readingProgressService;
