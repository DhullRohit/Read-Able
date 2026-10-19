// Handles HTTP requests and responses for document management endpoints (upload, retrieve, delete)
import * as documentService from "./document.service.js";
import * as extractionService from "./extraction/document-extraction.service.js";
import { sendSuccess } from "../../shared/utils/response.js";
import { safelyDeleteFile } from "../../shared/middleware/upload.middleware.js";
import storageService from "../../shared/storage/storage.service.js";
import { NotFoundError } from "../../shared/utils/errors.js";
import path from "node:path";

export const getDocuments = async (req, res, next) => {
  try {
    const documents = await documentService.getDocumentsByUser(req.user.id);
    sendSuccess(res, documents);
  } catch (err) {
    next(err);
  }
};

export const getDocument = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const document = await documentService.getDocumentById(id, req.user.id);
    sendSuccess(res, document);
  } catch (err) {
    next(err);
  }
};

export const createDocument = async (req, res, next) => {
  try {
    // If multipart file upload
    if (req.file) {
      const document = await documentService.createDocumentFromFile({
        userId: req.user.id,
        file: req.file,
        title: req.body?.title,
      });

      // If duplicate, do NOT run extraction service again
      if (document.duplicate) {
        return sendSuccess(res, document, "This document is already in your library", 200);
      }

      // Asynchronously trigger text extraction in the background
      extractionService.extractDocument(document).catch((err) => {
        // Status and error are captured inside extractionStore
        console.error(`Background text extraction failed for document ${document.id}:`, err.message);
      });

      return sendSuccess(res, document, "Document uploaded successfully", 201);
    }

    // Preserve existing JSON metadata behavior
    const document = await documentService.createDocument(req.user.id, req.body);
    sendSuccess(res, document, "Document created successfully", 201);
  } catch (err) {
    if (req.file?.path) {
      await safelyDeleteFile(req.file.path);
    }
    next(err);
  }
};

export const updateDocument = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const document = await documentService.updateDocument(id, req.user.id, req.body);
    sendSuccess(res, document, "Document updated successfully");
  } catch (err) {
    next(err);
  }
};

export const deleteDocument = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const result = await documentService.deleteDocument(id, req.user.id);
    sendSuccess(res, result, "Document deleted successfully");
  } catch (err) {
    next(err);
  }
};
export const streamDocument = async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      throw new NotFoundError("Document not found");
    }

    // Checks that the document belongs to the authenticated user.
    const document = await documentService.getDocumentById(
      id,
      req.user.id
    );

    // Check that the actual PDF exists on disk.
    const exists = await storageService.fileExists(document.s3Key);

    if (!exists) {
      throw new NotFoundError("Document file not found on server");
    }

    const stream = await storageService.getStream(document.s3Key);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${path.basename(document.fileName).replace(/["\r\n]/g, "")}"`
    );

    stream.on("error", (err) => {
      if (res.headersSent) {
        res.destroy(err);
      } else {
        next(err);
      }
    });

    stream.pipe(res);
  } catch (err) {
    next(err);
  }
};

export const getDocumentContent = async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      throw new NotFoundError("Document not found");
    }

    const content = await extractionService.getDocumentContent(id, req.user.id);
    sendSuccess(res, content, "Document content retrieved successfully");
  } catch (err) {
    next(err);
  }
};
