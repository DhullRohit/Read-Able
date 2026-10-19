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
 * Persist to PostgreSQL (DocumentPage table + Document.status)
 *
 * Persistence strategy:
 * Each extracted page is stored as a DocumentPage row linked to the Document.
 * Document.status reflects the current extraction state (UPLOADED / PROCESSING / PROCESSED / FAILED).
 * On backend restart, content is read from the DB instead of being re-extracted from storage.
 */

import prisma from "../../../config/database.js";
import storageService from "../../../shared/storage/storage.service.js";
import { NotFoundError } from "../../../shared/utils/errors.js";
import * as documentService from "../document.service.js";
import { extractTextFromPdfBuffer } from "./pdf-extractor.js";
import { normalizeText, extractParagraphs } from "./text-normalizer.js";

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
 * Extracts and normalizes text content for a given document entity,
 * then persists all pages and status to PostgreSQL in a single transaction.
 *
 * @param {import("@prisma/client").Document} document
 * @returns {Promise<Object>}
 */
export async function extractDocument(document) {
  const docId = document.id;

  // Mark document as PROCESSING in DB (safely catch if document was deleted)
  try {
    await prisma.document.update({
      where: { id: docId },
      data: { status: "PROCESSING" },
    });
  } catch (err) {
    if (err.code === "P2025") {
      return null;
    }
    throw err;
  }

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

    // Check if document was deleted while extracting
    const currentDoc = await prisma.document.findUnique({
      where: { id: docId },
      select: { id: true },
    });
    if (!currentDoc) {
      return null;
    }

    // Persist pages + update status atomically
    await prisma.$transaction(async (tx) => {
      // Remove any previously extracted pages for this document (idempotent retry)
      await tx.documentPage.deleteMany({ where: { documentId: docId } });

      // Insert all pages
      await tx.documentPage.createMany({
        data: structuredPages.map((p) => ({
          documentId: docId,
          pageNumber: p.pageNumber,
          text: p.text,
          paragraphs: p.paragraphs,
        })),
      });

      // Mark document as PROCESSED
      await tx.document.update({
        where: { id: docId },
        data: { status: "PROCESSED" },
      });
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

    return structuredContent;
  } catch (err) {
    if (err.code === "P2025") {
      return null;
    }

    // Mark document as FAILED in DB if it still exists
    try {
      await prisma.document.update({
        where: { id: docId },
        data: { status: "FAILED" },
      });
    } catch (e) {
      // Document might have been deleted; ignore status update error
    }

    throw err;
  }
}

/**
 * Retrieves the structured text content for a document from the DB.
 * Falls back to live extraction if the document has not yet been processed.
 * Enforces authentication and document ownership via documentService.getDocumentById.
 *
 * @param {number} documentId
 * @param {number} userId
 * @returns {Promise<Object>}
 */
export async function getDocumentContent(documentId, userId) {
  // Enforce document existence and user ownership
  const document = await documentService.getDocumentById(documentId, userId);

  if (document.status === "PROCESSED") {
    // Serve from DB
    const pages = await prisma.documentPage.findMany({
      where: { documentId: document.id },
      orderBy: { pageNumber: "asc" },
      select: { pageNumber: true, text: true, paragraphs: true },
    });

    return {
      documentId: document.id,
      title: document.title,
      fileName: document.fileName,
      status: "PROCESSED",
      totalPages: pages.length,
      pages,
    };
  }

  if (document.status === "PROCESSING") {
    return {
      documentId: document.id,
      title: document.title,
      fileName: document.fileName,
      status: "PROCESSING",
      totalPages: 0,
      pages: [],
    };
  }

  if (document.status === "FAILED") {
    return {
      documentId: document.id,
      title: document.title,
      fileName: document.fileName,
      status: "FAILED",
      totalPages: 0,
      pages: [],
    };
  }

  // UPLOADED or unknown: extract now and persist to DB
  return await extractDocument(document);
}

/**
 * Removes persisted extraction content when a document is deleted.
 * DocumentPage rows are cascade-deleted by PostgreSQL on Document deletion.
 * This function resets the status to UPLOADED to keep the service layer consistent
 * when called from deleteDocument before the Document row itself is removed.
 *
 * @param {number} documentId
 */
export async function invalidateDocumentContent(documentId) {
  try {
    await prisma.document.update({
      where: { id: documentId },
      data: { status: "UPLOADED" },
    });
  } catch (_err) {
    // Document may already be gone (cascade delete in progress); safe to ignore.
  }
}

/**
 * Returns current processing status for a document from the DB.
 *
 * @param {number} documentId
 * @returns {Promise<string|null>}
 */
export async function getDocumentProcessingStatus(documentId) {
  const doc = await prisma.document.findUnique({
    where: { id: documentId },
    select: { status: true },
  });
  return doc ? doc.status : null;
}
