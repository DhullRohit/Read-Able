// Contains business logic for document operations like file processing, storage, and metadata management
import crypto from "crypto";
import fs from "fs";
import prisma from "../../config/database.js";
import { NotFoundError, ForbiddenError } from "../../shared/utils/errors.js";
import storageService from "../../shared/storage/storage.service.js";
import { safelyDeleteFile } from "../../shared/middleware/upload.middleware.js";
import { invalidateDocumentContent } from "./extraction/document-extraction.service.js";
import readingProgressService from "../reading/reading.service.js";

export const getDocumentsByUser = async (userId) => {
  return await prisma.document.findMany({
    where: { userId },
    orderBy: { lastUploadedAt: "desc" },
  });
};

export const getDocumentById = async (id, userId) => {
  const document = await prisma.document.findUnique({
    where: { id },
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
 * Saves an uploaded file to permanent storage and creates a Document record in PostgreSQL.
 * If duplicate is detected by SHA-256 (or fileName+size for legacy), returns existing doc with duplicate: true.
 * If database insertion fails, executes a compensating rollback to remove the stored file.
 * @param {Object} params
 * @param {number} params.userId - Authenticated user ID
 * @param {Express.Multer.File} params.file - Validated file object
 * @param {string} [params.title] - Optional document title
 * @returns {Promise<import("@prisma/client").Document & { duplicate?: boolean }>}
 */
export const createDocumentFromFile = async ({ userId, file, title }) => {
  const docTitle =
    (title && typeof title === "string" && title.trim()) ||
    (file.originalname ? file.originalname.replace(/\.[^/.]+$/, "") : "Untitled Document");

  // Compute SHA-256 of the file buffer BEFORE storing to S3 or starting processing pipeline
  const fileBuffer = await fs.promises.readFile(file.path);
  const contentHash = crypto.createHash("sha256").update(fileBuffer).digest("hex");

  // Check for duplicate document for this user by contentHash first
  let existing = await prisma.document.findFirst({
    where: {
      userId,
      contentHash,
    },
  });

  // Fallback for older documents that have no contentHash: match by fileName and fileSize
  if (!existing) {
    existing = await prisma.document.findFirst({
      where: {
        userId,
        contentHash: null,
        fileName: file.originalname,
        fileSize: file.size,
      },
    });
  }

  // If a duplicate match is found: do NOT create row, do NOT upload to S3, do NOT extract
  if (existing) {
    await safelyDeleteFile(file.path);

    const updated = await prisma.document.update({
      where: { id: existing.id },
      data: {
        lastUploadedAt: new Date(),
        contentHash: existing.contentHash || contentHash,
      },
    });

    return {
      ...updated,
      duplicate: true,
    };
  }

  // Save the temporary file into permanent storage using the storage abstraction
  const storageResult = await storageService.saveFile({
    tempPath: file.path,
    originalName: file.originalname,
    mimeType: file.mimetype,
    userId,
  });

  try {
    const document = await prisma.document.create({
      data: {
        title: docTitle,
        fileName: storageResult.originalName,
        fileSize: storageResult.size,
        mimeType: storageResult.mimeType,
        s3Key: storageResult.key,
        userId,
        contentHash,
        lastUploadedAt: new Date(),
      },
    });

    return {
      ...document,
      duplicate: false,
    };
  } catch (dbError) {
    // Compensating rollback: delete newly saved physical file if DB persistence fails
    try {
      await storageService.deleteFile(storageResult.key);
    } catch (cleanupErr) {
      console.error("Critical: Failed to clean up storage file after database error:", cleanupErr);
    }
    throw dbError;
  }
};

export const createDocument = async (userId, data) => {
  const { title, fileName, fileSize, mimeType, s3Key } = data;
  const docFileName = fileName || title || "untitled.pdf";
  const docTitle = title || fileName || "Untitled Document";
  const docS3Key = s3Key || `doc-${userId}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const docSize = typeof fileSize === "number" ? fileSize : 0;
  const docMime = mimeType || "application/octet-stream";

  return await prisma.document.create({
    data: {
      title: docTitle,
      fileName: docFileName,
      fileSize: docSize,
      mimeType: docMime,
      s3Key: docS3Key,
      userId,
    },
  });
};

export const updateDocument = async (id, userId, data) => {
  const document = await prisma.document.findUnique({
    where: { id },
  });

  if (!document) {
    throw new NotFoundError("Document not found");
  }

  if (document.userId !== userId) {
    throw new ForbiddenError("Access denied");
  }

  return await prisma.document.update({
    where: { id },
    data: {
      ...(data.title ? { title: data.title } : {}),
      ...(data.fileName ? { fileName: data.fileName } : {}),
    },
  });
};

export const deleteDocument = async (id, userId) => {
  const document = await prisma.document.findUnique({
    where: { id },
  });

  if (!document || document.userId !== userId) {
    throw new NotFoundError("Document not found");
  }

  // Delete the Document row inside a transaction; the database cascade-deletes
  // ReadingProgress, Note, Highlight, DocumentPage rows.
  // Explicitly delete related records inside the transaction for atomic consistency.
  await prisma.$transaction(async (tx) => {
    await tx.readingProgress.deleteMany({ where: { documentId: id } });
    await tx.note.deleteMany({ where: { documentId: id } });
    await tx.highlight.deleteMany({ where: { documentId: id } });
    await tx.documentPage.deleteMany({ where: { documentId: id } });
    await tx.document.delete({
      where: { id },
    });
  });

  // Clean up physical file from storage (best-effort, never fails DB deletion)
  if (document.s3Key) {
    try {
      await storageService.deleteFile(document.s3Key);
    } catch (err) {
      console.error(`Failed to clean up storage file for key ${document.s3Key}:`, err);
    }
  }

  return { id };
};

