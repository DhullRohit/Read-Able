/**
 * reading.controller.js
 *
 * Express controller handling requests for reading progress, notes, and highlights.
 */

import { sendSuccess } from "../../shared/utils/response.js";
import { ValidationError } from "../../shared/utils/errors.js";
import * as readingService from "./reading.service.js";

function getDocumentIdParam(req) {
  const documentId = req.params.documentId || req.params.id;
  if (!documentId) {
    throw new ValidationError("Document ID is required");
  }
  return documentId;
}

export const getReading = async (req, res, next) => {
  try {
    const documentId = getDocumentIdParam(req);
    res.setHeader("Cache-Control", "no-store");
    const data = await readingService.getReadingData(req.user.id, documentId);
    sendSuccess(res, data, "Reading data retrieved successfully");
  } catch (err) {
    next(err);
  }
};

export const saveProgress = async (req, res, next) => {
  try {
    const documentId = getDocumentIdParam(req);
    const { lastPage, currentPage } = req.body || {};
    const page = lastPage !== undefined ? lastPage : currentPage;

    if (page === undefined || page === null) {
      throw new ValidationError("lastPage is required");
    }

    const saved = await readingService.saveReadingProgress(req.user.id, documentId, page);
    sendSuccess(res, saved, "Reading progress saved successfully");
  } catch (err) {
    next(err);
  }
};

export const createNote = async (req, res, next) => {
  try {
    const documentId = getDocumentIdParam(req);
    const saved = await readingService.createNote(req.user.id, documentId, req.body || {});
    sendSuccess(res, saved, "Note created successfully", 201);
  } catch (err) {
    next(err);
  }
};

export const updateNote = async (req, res, next) => {
  try {
    const documentId = getDocumentIdParam(req);
    const noteId = req.params.id;
    const saved = await readingService.updateNote(req.user.id, documentId, noteId, req.body || {});
    sendSuccess(res, saved, "Note updated successfully");
  } catch (err) {
    next(err);
  }
};

export const deleteNote = async (req, res, next) => {
  try {
    const documentId = getDocumentIdParam(req);
    const noteId = req.params.id;
    const deleted = await readingService.deleteNote(req.user.id, documentId, noteId);
    sendSuccess(res, deleted, "Note deleted successfully");
  } catch (err) {
    next(err);
  }
};

export const createHighlight = async (req, res, next) => {
  try {
    const documentId = getDocumentIdParam(req);
    const saved = await readingService.createHighlight(req.user.id, documentId, req.body || {});
    sendSuccess(res, saved, "Highlight created successfully", 201);
  } catch (err) {
    next(err);
  }
};

export const updateHighlight = async (req, res, next) => {
  try {
    const documentId = getDocumentIdParam(req);
    const highlightId = req.params.id;
    const saved = await readingService.updateHighlight(req.user.id, documentId, highlightId, req.body || {});
    sendSuccess(res, saved, "Highlight updated successfully");
  } catch (err) {
    next(err);
  }
};

export const deleteHighlight = async (req, res, next) => {
  try {
    const documentId = getDocumentIdParam(req);
    const highlightId = req.params.id;
    const deleted = await readingService.deleteHighlight(req.user.id, documentId, highlightId);
    sendSuccess(res, deleted, "Highlight deleted successfully");
  } catch (err) {
    next(err);
  }
};

export const deleteHighlights = async (req, res, next) => {
  try {
    const documentId = getDocumentIdParam(req);
    const { ids } = req.body || {};
    const result = await readingService.deleteBatchHighlights(req.user.id, documentId, ids);
    sendSuccess(res, result, "Highlights deleted successfully");
  } catch (err) {
    next(err);
  }
};

export const getRecent = async (req, res, next) => {
  try {
    const list = await readingService.getRecentReading(req.user.id);
    sendSuccess(res, list, "Recent reading list retrieved");
  } catch (err) {
    next(err);
  }
};

export const getBookmarks = async (req, res, next) => {
  try {
    const list = await readingService.getBookmarks(req.user.id);
    sendSuccess(res, list, "Bookmarks retrieved");
  } catch (err) {
    next(err);
  }
};

export const getNotes = async (req, res, next) => {
  try {
    const list = await readingService.getUserNotes(req.user.id);
    sendSuccess(res, list, "User notes retrieved");
  } catch (err) {
    next(err);
  }
};
