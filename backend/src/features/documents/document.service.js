// Contains business logic for document operations like file processing, storage, and metadata management
import prisma from "../../config/database.js";
import { NotFoundError, ForbiddenError } from "../../shared/utils/errors.js";

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

  return { id };
};
