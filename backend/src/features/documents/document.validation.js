// Defines validation functions for document-related request payloads and file uploads
import fs from "fs";
import path from "path";
import { ValidationError } from "../../shared/utils/errors.js";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MiB
const PDF_MAGIC_BYTES = "%PDF-";

/**
 * Validates the file content by reading magic bytes to ensure it is a true PDF.
 * @param {string} filePath - Absolute path to the temporary file on disk
 * @returns {Promise<boolean>}
 */
export const validatePdfMagicBytes = async (filePath) => {
  let fileHandle;
  try {
    fileHandle = await fs.promises.open(filePath, "r");
    const buffer = Buffer.alloc(5);
    const { bytesRead } = await fileHandle.read(buffer, 0, 5, 0);

    if (bytesRead < 5) {
      throw new ValidationError("Invalid PDF file: file is truncated or empty");
    }

    if (buffer.toString("utf8") !== PDF_MAGIC_BYTES) {
      throw new ValidationError("Invalid PDF file: content signature does not match PDF format (%PDF-)");
    }

    return true;
  } finally {
    if (fileHandle) {
      await fileHandle.close();
    }
  }
};

/**
 * Validates uploaded file metadata and binary signature.
 * Throws ValidationError if any check fails.
 * @param {Express.Multer.File} file
 */
export const validateUploadedPdf = async (file) => {
  if (!file) {
    throw new ValidationError("File is required. Please upload a PDF file using field name 'file'");
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    throw new ValidationError("File size exceeds the 10 MiB limit");
  }

  // Check file extension
  const ext = path.extname(file.originalname || "").toLowerCase();
  if (ext !== ".pdf") {
    throw new ValidationError("Only PDF files (.pdf) are allowed");
  }

  // Validate actual binary contents
  await validatePdfMagicBytes(file.path);
};
