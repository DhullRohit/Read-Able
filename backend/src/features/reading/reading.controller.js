/**
 * reading.controller.js
 *
 * Handles HTTP requests and responses for reading progress tracking.
 * Strictly enforces JWT authentication and document ownership.
 */

import { sendSuccess } from "../../shared/utils/response.js";
import { ValidationError } from "../../shared/utils/errors.js";
import * as documentService from "../documents/document.service.js";
import readingProgressService from "./reading.service.js";

/**
 * Validates document access and ownership for a given user.
 * Allows "demo" document for local testing, otherwise validates against database.
 *
 * @param {string} documentId
 * @param {number} userId
 */
async function verifyDocumentAccess(documentId, userId) {
  if (documentId === "demo") return;

  const numId = parseInt(documentId, 10);
  if (isNaN(numId) || numId <= 0) {
    throw new ValidationError("Invalid document ID");
  }

  // Enforces existence and ownership (throws NotFoundError or ForbiddenError)
  await documentService.getDocumentById(numId, userId);
}

/**
 * GET /api/reading/progress/:documentId
 */
export const getProgress = async (req, res, next) => {
  try {
    const { documentId } = req.params;
    if (!documentId) {
      throw new ValidationError("Document ID is required");
    }

    await verifyDocumentAccess(documentId, req.user.id);

    const progress = readingProgressService.getProgress(req.user.id, documentId);
    sendSuccess(res, progress, "Reading progress retrieved successfully");
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/reading/progress/:documentId
 */
export const saveProgress = async (req, res, next) => {
  try {
    const { documentId } = req.params;
    if (!documentId) {
      throw new ValidationError("Document ID is required");
    }

    await verifyDocumentAccess(documentId, req.user.id);

    const { currentPage, totalPages, lastReadAt } = req.body || {};

    if (typeof currentPage !== "number" || currentPage < 1) {
      throw new ValidationError("currentPage must be a positive number");
    }

    const saved = readingProgressService.saveProgress(req.user.id, documentId, {
      currentPage,
      totalPages: typeof totalPages === "number" ? totalPages : 0,
      lastReadAt,
    });

    sendSuccess(res, saved, "Reading progress saved successfully");
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/reading/progress
 * Returns all saved progress records for the authenticated user.
 */
export const getUserProgressList = async (req, res, next) => {
  try {
    const allProgress = readingProgressService.getAllProgressForUser(req.user.id);
    sendSuccess(res, allProgress, "User reading progress retrieved successfully");
  } catch (err) {
    next(err);
  }
};
