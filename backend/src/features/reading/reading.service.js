/**
 * reading.service.js
 *
 * Database persistence logic for Reading Progress, Notes, and Highlights using Prisma.
 */

import prisma from "../../config/database.js";
import { NotFoundError, ForbiddenError, ValidationError } from "../../shared/utils/errors.js";

/**
 * Validates document existence and user ownership.
 * Throws NotFoundError if document does not exist, or ForbiddenError if not owned by user.
 *
 * @param {number} documentId
 * @param {number} userId
 */
export const verifyDocumentOwnership = async (documentId, userId) => {
  const docId = parseInt(documentId, 10);
  if (isNaN(docId) || docId <= 0) {
    throw new ValidationError("Invalid document ID");
  }

  const document = await prisma.document.findUnique({
    where: { id: docId },
    select: { id: true, userId: true },
  });

  if (!document) {
    throw new NotFoundError("Document not found");
  }

  if (document.userId !== userId) {
    throw new ForbiddenError("Access denied");
  }

  return document;
};

/**
 * Get all reading data for a document: progress, notes (asc), highlights (asc).
 */
export const getReadingData = async (userId, documentId) => {
  const docId = parseInt(documentId, 10);
  await verifyDocumentOwnership(docId, userId);

  const [progress, notes, highlights] = await Promise.all([
    prisma.readingProgress.findUnique({
      where: { userId_documentId: { userId, documentId: docId } },
    }),
    prisma.note.findMany({
      where: { userId, documentId: docId },
      orderBy: { createdAt: "asc" },
    }),
    prisma.highlight.findMany({
      where: { userId, documentId: docId },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  return {
    progress: progress || null,
    notes: notes || [],
    highlights: highlights || [],
  };
};

/**
 * Upsert reading progress for a user and document.
 */
export const saveReadingProgress = async (userId, documentId, lastPage) => {
  const docId = parseInt(documentId, 10);
  await verifyDocumentOwnership(docId, userId);

  const page = parseInt(lastPage, 10);
  if (isNaN(page) || page < 1) {
    throw new ValidationError("lastPage must be an integer >= 1");
  }

  return await prisma.readingProgress.upsert({
    where: { userId_documentId: { userId, documentId: docId } },
    update: { lastPage: page },
    create: { userId, documentId: docId, lastPage: page },
  });
};

/**
 * Create a new note.
 */
export const createNote = async (userId, documentId, { page, content }) => {
  const docId = parseInt(documentId, 10);
  await verifyDocumentOwnership(docId, userId);

  if (!content || typeof content !== "string" || !content.trim()) {
    throw new ValidationError("Note content must be non-empty");
  }

  let pageNum = null;
  if (page !== undefined && page !== null) {
    pageNum = parseInt(page, 10);
    if (isNaN(pageNum) || pageNum < 1) {
      pageNum = null;
    }
  }

  return await prisma.note.create({
    data: {
      userId,
      documentId: docId,
      page: pageNum,
      content: content.trim(),
    },
  });
};

/**
 * Update an existing note.
 */
export const updateNote = async (userId, documentId, noteId, { content, page }) => {
  const docId = parseInt(documentId, 10);
  await verifyDocumentOwnership(docId, userId);

  const nId = parseInt(noteId, 10);
  if (isNaN(nId) || nId <= 0) {
    throw new ValidationError("Invalid note ID");
  }

  const existing = await prisma.note.findUnique({
    where: { id: nId },
  });

  if (!existing || existing.userId !== userId || existing.documentId !== docId) {
    throw new NotFoundError("Note not found");
  }

  const dataToUpdate = {};
  if (content !== undefined) {
    if (typeof content !== "string" || !content.trim()) {
      throw new ValidationError("Note content cannot be empty");
    }
    dataToUpdate.content = content.trim();
  }

  if (page !== undefined) {
    if (page === null) {
      dataToUpdate.page = null;
    } else {
      const p = parseInt(page, 10);
      dataToUpdate.page = isNaN(p) || p < 1 ? null : p;
    }
  }

  return await prisma.note.update({
    where: { id: nId },
    data: dataToUpdate,
  });
};

/**
 * Delete a note.
 */
export const deleteNote = async (userId, documentId, noteId) => {
  const docId = parseInt(documentId, 10);
  await verifyDocumentOwnership(docId, userId);

  const nId = parseInt(noteId, 10);
  if (isNaN(nId) || nId <= 0) {
    throw new ValidationError("Invalid note ID");
  }

  const existing = await prisma.note.findUnique({
    where: { id: nId },
  });

  if (!existing || existing.userId !== userId || existing.documentId !== docId) {
    throw new NotFoundError("Note not found");
  }

  return await prisma.note.delete({
    where: { id: nId },
  });
};

/**
 * Create a new highlight.
 */
export const createHighlight = async (userId, documentId, { page, color, text, rects }) => {
  const docId = parseInt(documentId, 10);
  await verifyDocumentOwnership(docId, userId);

  const pageNum = parseInt(page, 10);
  if (isNaN(pageNum) || pageNum < 1) {
    throw new ValidationError("page must be an integer >= 1");
  }

  if (color !== "RED" && color !== "YELLOW") {
    throw new ValidationError("color must be RED or YELLOW");
  }

  if (!text || typeof text !== "string" || !text.trim()) {
    throw new ValidationError("text must be non-empty");
  }

  if (!rects) {
    throw new ValidationError("rects is required");
  }

  return await prisma.highlight.create({
    data: {
      userId,
      documentId: docId,
      page: pageNum,
      color,
      text: text.trim(),
      rects,
    },
  });
};

/**
 * Update highlight color.
 */
export const updateHighlight = async (userId, documentId, highlightId, { color }) => {
  const docId = parseInt(documentId, 10);
  await verifyDocumentOwnership(docId, userId);

  const hId = parseInt(highlightId, 10);
  if (isNaN(hId) || hId <= 0) {
    throw new ValidationError("Invalid highlight ID");
  }

  if (color !== "RED" && color !== "YELLOW") {
    throw new ValidationError("color must be RED or YELLOW");
  }

  const existing = await prisma.highlight.findUnique({
    where: { id: hId },
  });

  if (!existing || existing.userId !== userId || existing.documentId !== docId) {
    throw new NotFoundError("Highlight not found");
  }

  return await prisma.highlight.update({
    where: { id: hId },
    data: { color },
  });
};

/**
 * Delete a highlight.
 */
export const deleteHighlight = async (userId, documentId, highlightId) => {
  const docId = parseInt(documentId, 10);
  await verifyDocumentOwnership(docId, userId);

  const hId = parseInt(highlightId, 10);
  if (isNaN(hId) || hId <= 0) {
    throw new ValidationError("Invalid highlight ID");
  }

  const existing = await prisma.highlight.findUnique({
    where: { id: hId },
  });

  if (!existing || existing.userId !== userId || existing.documentId !== docId) {
    throw new NotFoundError("Highlight not found");
  }

  return await prisma.highlight.delete({
    where: { id: hId },
  });
};

/**
 * Batch delete highlights overlapping selection or passage.
 * DELETE /api/documents/:documentId/highlights with body { ids: [] }
 */
export const deleteBatchHighlights = async (userId, documentId, ids) => {
  const docId = parseInt(documentId, 10);
  await verifyDocumentOwnership(docId, userId);

  if (!Array.isArray(ids)) {
    throw new ValidationError("ids must be an array");
  }

  const validIds = ids
    .map((id) => parseInt(id, 10))
    .filter((id) => !isNaN(id) && id > 0);

  if (validIds.length === 0) {
    return { count: 0 };
  }

  return await prisma.highlight.deleteMany({
    where: {
      userId,
      documentId: docId,
      id: { in: validIds },
    },
  });
};

/**
 * GET /api/reading/recent
 * Dashboard only: last 5 read documents (ReadingProgress by updatedAt desc, take 5):
 * { documentId, title, fileName, lastPage, updatedAt }
 */
export const getRecentReading = async (userId) => {
  const progressList = await prisma.readingProgress.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    take: 5,
    include: {
      document: {
        select: { id: true, title: true, fileName: true },
      },
    },
  });

  return progressList
    .filter((p) => p.document)
    .map((p) => ({
      documentId: p.documentId,
      title: p.document.title,
      fileName: p.document.fileName,
      lastPage: p.lastPage,
      updatedAt: p.updatedAt,
    }));
};

/**
 * GET /api/reading/bookmarks
 * ALL user documents, no limit:
 * { documentId, title, fileName, lastPage, updatedAt },
 * ordered by ReadingProgress.updatedAt desc
 */
export const getBookmarks = async (userId) => {
  const progressList = await prisma.readingProgress.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    include: {
      document: {
        select: { id: true, title: true, fileName: true },
      },
    },
  });

  return progressList
    .filter((p) => p.document)
    .map((p) => ({
      documentId: p.documentId,
      title: p.document.title,
      fileName: p.document.fileName,
      lastPage: p.lastPage,
      updatedAt: p.updatedAt,
    }));
};

/**
 * GET /api/reading/notes
 * ALL user documents that have notes:
 * { documentId, title, notes: [{ id, page, content, createdAt }] },
 * most recent note first
 */
export const getUserNotes = async (userId) => {
  const documentsWithNotes = await prisma.document.findMany({
    where: {
      userId,
      notes: { some: { userId } },
    },
    select: {
      id: true,
      title: true,
      notes: {
        where: { userId },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          page: true,
          content: true,
          createdAt: true,
        },
      },
    },
  });

  documentsWithNotes.sort((a, b) => {
    const aTime = a.notes[0] ? new Date(a.notes[0].createdAt).getTime() : 0;
    const bTime = b.notes[0] ? new Date(b.notes[0].createdAt).getTime() : 0;
    return bTime - aTime;
  });

  return documentsWithNotes.map((d) => ({
    documentId: d.id,
    title: d.title,
    notes: d.notes,
  }));
};

/**
 * Clear reading data (handled by Prisma cascade on document delete).
 */
export const clearProgress = async (userId, documentId) => {
  return true;
};

const readingService = {
  verifyDocumentOwnership,
  getReadingData,
  saveReadingProgress,
  createNote,
  updateNote,
  deleteNote,
  createHighlight,
  updateHighlight,
  deleteHighlight,
  getRecentReading,
  getBookmarks,
  getUserNotes,
  clearProgress,
};

export default readingService;
