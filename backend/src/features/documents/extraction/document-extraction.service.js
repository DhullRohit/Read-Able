/**
 * document-extraction.service.js
 *
 * Orchestrates the Phase 2 Document Text Extraction Pipeline:
 *
 * Uploaded Document
 *       ↓
 * Retrieve PDF stream via existing StorageService (Local / S3)
 *       ↓
 * PDF Text Extraction (pdf-extractor.js)
 *       ↓
 * Page-Level Separation
 *       ↓
 * Text Cleaning / Normalization (text-normalizer.js)
 *       ↓
 * Structured Document Content
 *       ↓
 * In-memory Store / Expose via API
 *
 * Schema limitation:
 * The database schema is frozen (no status or extracted content fields).
 * To respect Rule 1, extracted content and processing states (PROCESSING, PROCESSED, FAILED)
 * are cleanly managed in an in-memory store and exposed via the service and API.
 */

import storageService from "../../../shared/storage/storage.service.js";
import { NotFoundError } from "../../../shared/utils/errors.js";
import * as documentService from "../document.service.js";
import { extractTextFromPdfBuffer } from "./pdf-extractor.js";
import { normalizeText, extractParagraphs } from "./text-normalizer.js";

// In-memory cache for extracted document content and processing states
// Map<documentId, { status: 'PROCESSING'|'PROCESSED'|'FAILED', data?: Object, error?: string, updatedAt: string }>
const extractionStore = new Map();

/**
 * Converts a readable stream to a Buffer.
 *
 * @param {import("stream").Readable} stream
 * @returns {Promise<Buffer>}
 */
async function streamToBuffer(stream) {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

/**
 * Extracts and normalizes text content for a given document entity.
 * Retrieves PDF stream strictly through the existing StorageService abstraction.
 *
 * @param {import("@prisma/client").Document} document
 * @returns {Promise<Object>}
 */
export async function extractDocument(document) {
  const docId = document.id;

  // Mark processing state
  extractionStore.set(docId, {
    status: "PROCESSING",
    updatedAt: new Date().toISOString(),
  });

  try {
    const exists = await storageService.fileExists(document.s3Key);
    if (!exists) {
      throw new NotFoundError("Document file not found in storage");
    }

    // Retrieve PDF bytes through storage abstraction
    const stream = await storageService.getStream(document.s3Key);
    const buffer = await streamToBuffer(stream);

    // Page-by-page extraction
    const rawPages = await extractTextFromPdfBuffer(buffer);

    // Normalize each page's text conservatively and segment into paragraphs
    const structuredPages = rawPages.map((page) => {
      const normalized = normalizeText(page.rawText);
      const paragraphs = extractParagraphs(normalized);

      return {
        pageNumber: page.pageNumber,
        text: normalized,
        paragraphs,
      };
    });

    const structuredContent = {
      documentId: document.id,
      title: document.title,
      fileName: document.fileName,
      status: "PROCESSED",
      totalPages: structuredPages.length,
      pages: structuredPages,
      extractedAt: new Date().toISOString(),
    };

    // Store in cache
    extractionStore.set(docId, {
      status: "PROCESSED",
      data: structuredContent,
      updatedAt: new Date().toISOString(),
    });

    return structuredContent;
  } catch (err) {
    extractionStore.set(docId, {
      status: "FAILED",
      error: err.message || "Failed to extract text from document",
      updatedAt: new Date().toISOString(),
    });

    throw err;
  }
}

/**
 * Retrieves the structured text content for a document, performing extraction if not yet cached.
 * Enforces authentication and document ownership via documentService.getDocumentById.
 *
 * @param {number} documentId
 * @param {number} userId
 * @returns {Promise<Object>}
 */
export async function getDocumentContent(documentId, userId) {
  // Enforce document existence and user ownership
  const document = await documentService.getDocumentById(documentId, userId);

  const cached = extractionStore.get(documentId);

  if (cached) {
    if (cached.status === "PROCESSED" && cached.data) {
      return cached.data;
    }

    if (cached.status === "PROCESSING") {
      return {
        documentId: document.id,
        title: document.title,
        fileName: document.fileName,
        status: "PROCESSING",
        totalPages: 0,
        pages: [],
      };
    }

    if (cached.status === "FAILED") {
      return {
        documentId: document.id,
        title: document.title,
        fileName: document.fileName,
        status: "FAILED",
        totalPages: 0,
        pages: [],
        error: cached.error,
      };
    }
  }

  // Not yet cached or previous state expired: extract now
  return await extractDocument(document);
}

/**
 * Removes cached extraction content when a document is deleted.
 *
 * @param {number} documentId
 */
export function invalidateDocumentContent(documentId) {
  extractionStore.delete(documentId);
}

/**
 * Returns current processing status for a document.
 *
 * @param {number} documentId
 * @returns {string|null}
 */
export function getDocumentProcessingStatus(documentId) {
  const cached = extractionStore.get(documentId);
  return cached ? cached.status : null;
}
