// Configures Multer for safe temporary file uploads with strict size and type enforcement
import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { ValidationError } from "../utils/errors.js";
import { validateUploadedPdf } from "../../features/documents/document.validation.js";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MiB
const UPLOAD_TEMP_DIR = path.resolve(process.cwd(), "uploads", "temp");

// Ensure temporary upload directory exists
if (!fs.existsSync(UPLOAD_TEMP_DIR)) {
  fs.mkdirSync(UPLOAD_TEMP_DIR, { recursive: true });
}

export const safelyDeleteFile = async (filePath) => {
  if (!filePath) return;
  try {
    await fs.promises.unlink(filePath);
  } catch (err) {
    if (err.code !== "ENOENT") {
      console.error("Failed to clean up temporary file:", err);
    }
  }
};

// Disk storage using strictly generated unique identifiers, never client filenames
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_TEMP_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `tmp-${Date.now()}-${crypto.randomUUID()}.tmp`;
    cb(null, uniqueSuffix);
  },
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname || "").toLowerCase();
  const mime = (file.mimetype || "").toLowerCase();

  // Basic client-side metadata check before writing to disk
  if (ext !== ".pdf" || (mime !== "application/pdf" && mime !== "application/x-pdf")) {
    return cb(new ValidationError("Only PDF files (.pdf) are allowed"));
  }

  cb(null, true);
};

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1,
  },
  fileFilter,
});

/**
 * Middleware handling multipart/form-data file uploads.
 * If request is application/json or non-multipart, skips Multer to preserve existing JSON metadata endpoints.
 */
export const uploadDocumentMiddleware = (req, res, next) => {
  const contentType = req.headers["content-type"] || "";

  // If not multipart, pass through to preserve existing JSON metadata handling
  if (!contentType.toLowerCase().includes("multipart/form-data")) {
    return next();
  }

  upload.single("file")(req, res, async (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return next(new ValidationError("File size exceeds 10 MiB limit"));
        }
        if (err.code === "LIMIT_UNEXPECTED_FILE") {
          return next(
            new ValidationError(`Unexpected field '${err.field}'. File must be uploaded using field name 'file'`)
          );
        }
        return next(new ValidationError(err.message));
      }
      return next(err);
    }

    // Require file in multipart uploads
    if (!req.file) {
      return next(new ValidationError("File is required. Please upload a PDF file using field name 'file'"));
    }

    // Deep server-side validation (content signature check)
    try {
      await validateUploadedPdf(req.file);
      next();
    } catch (validationErr) {
      // Clean up temporary file immediately on validation rejection
      await safelyDeleteFile(req.file.path);
      next(validationErr);
    }
  });
};
