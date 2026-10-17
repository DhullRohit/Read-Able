// Contains business logic for document operations like file processing, storage, and metadata management
import prisma from "../../config/database.js";
import { NotFoundError, ForbiddenError } from "../../shared/utils/errors.js";
import storageService from "../../shared/storage/storage.service.js";
import { invalidateDocumentContent } from "./extraction/document-extraction.service.js";
import readingProgressService from "../reading/reading.service.js";

export const getDocumentsByUser = async (userId) => {
  return await prisma.document.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
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
 * If database insertion fails, executes a compensating rollback to remove the stored file.
 * @param {Object} params
 * @param {number} params.userId - Authenticated user ID
 * @param {Express.Multer.File} params.file - Validated file object
 * @param {string} [params.title] - Optional document title
 * @returns {Promise<import("@prisma/client").Document>}
 */
export const createDocumentFromFile = async ({ userId, file, title }) => {
  const docTitle =
    (title && typeof title === "string" && title.trim()) ||
    (file.originalname ? file.originalname.replace(/\.[^/.]+$/, "") : "Untitled Document");

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
      },
    });

    return document;
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

  if (!document) {
    throw new NotFoundError("Document not found");
  }

  if (document.userId !== userId) {
    throw new ForbiddenError("Access denied");
  }

  await prisma.document.delete({
    where: { id },
  });

  // Clean up physical file from storage
  if (document.s3Key) {
    try {
      await storageService.deleteFile(document.s3Key);
    } catch (err) {
      console.error(`Failed to clean up storage file for key ${document.s3Key}:`, err);
    }
  }

  // Clean up cached extraction and reading progress
  invalidateDocumentContent(id);
  readingProgressService.clearProgress(userId, id);

  return { id };
};

