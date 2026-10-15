// Local filesystem implementation of the StorageProvider interface with path traversal protection
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { NotFoundError, ValidationError } from "../utils/errors.js";

const DEFAULT_DOCUMENTS_DIR = path.resolve(process.cwd(), "uploads", "documents");
const SAFE_KEY_REGEX = /^[a-zA-Z0-9_\-\.]+$/;

export class LocalStorageProvider {
  /**
   * @param {string} [storageDir] - Root directory for permanent file storage
   */
  constructor(storageDir = DEFAULT_DOCUMENTS_DIR) {
    this.storageDir = path.resolve(storageDir);
    this._ensureDirectory();
  }

  /**
   * Ensures the storage root directory exists
   * @private
   */
  _ensureDirectory() {
    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true });
    }
  }

  /**
   * Generates a collision-resistant unique storage key
   * @param {Object} params
   * @param {string} [params.originalName]
   * @param {number|string} [params.userId]
   * @returns {string}
   */
  generateKey({ originalName = "", userId } = {}) {
    const ext = path.extname(originalName).toLowerCase() || ".pdf";
    const userPrefix = userId ? `${userId}-` : "";
    return `doc-${userPrefix}${Date.now()}-${crypto.randomUUID()}${ext}`;
  }

  /**
   * Resolves a key to an absolute filesystem path and guarantees path traversal protection
   * @param {string} key
   * @returns {string}
   */
  resolveSafePath(key) {
    if (!key || typeof key !== "string") {
      throw new ValidationError("Storage key must be a non-empty string");
    }

    const trimmedKey = key.trim();

    // Key must only consist of alphanumeric characters, hyphens, underscores, and dots
    if (!SAFE_KEY_REGEX.test(trimmedKey) || trimmedKey.includes("..")) {
      throw new ValidationError("Invalid storage key: path traversal attempt detected");
    }

    const resolvedPath = path.resolve(this.storageDir, trimmedKey);

    // Strict containment check: resolved path must be directly inside storageDir
    if (path.dirname(resolvedPath) !== this.storageDir || !resolvedPath.startsWith(this.storageDir)) {
      throw new ValidationError("Invalid storage key: path traversal attempt detected");
    }

    return resolvedPath;
  }

  /**
   * Moves a temporary file into permanent storage under a generated key
   * @param {import("./storage.types.js").SaveFileOptions} options
   * @returns {Promise<import("./storage.types.js").SaveFileResult>}
   */
  async saveFile({ tempPath, originalName, mimeType = "application/pdf", userId }) {
    if (!tempPath || typeof tempPath !== "string") {
      throw new ValidationError("Source temporary file path is required");
    }

    // Verify source temporary file exists
    try {
      await fs.promises.access(tempPath, fs.constants.R_OK);
    } catch {
      throw new ValidationError("Source temporary file does not exist or is not readable");
    }

    const key = this.generateKey({ originalName, userId });
    const targetPath = this.resolveSafePath(key);

    // Move file atomically; fall back to copy+unlink across different filesystems (EXDEV)
    try {
      await fs.promises.rename(tempPath, targetPath);
    } catch (renameErr) {
      if (renameErr.code === "EXDEV") {
        await fs.promises.copyFile(tempPath, targetPath);
        await fs.promises.unlink(tempPath);
      } else {
        throw renameErr;
      }
    }

    // Verify written file size on disk
    const stat = await fs.promises.stat(targetPath);

    return {
      key,
      size: stat.size,
      originalName: originalName || key,
      mimeType,
    };
  }

  /**
   * Returns a readable stream for a stored file
   * @param {string} key
   * @returns {Promise<import("fs").ReadStream>}
   */
  async getStream(key) {
    const targetPath = this.resolveSafePath(key);
    const exists = await this.fileExists(key);

    if (!exists) {
      throw new NotFoundError("File not found in storage");
    }

    return fs.createReadStream(targetPath);
  }

  /**
   * Checks whether a file exists in storage
   * @param {string} key
   * @returns {Promise<boolean>}
   */
  async fileExists(key) {
    try {
      const targetPath = this.resolveSafePath(key);
      await fs.promises.access(targetPath, fs.constants.F_OK);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Deletes a file from storage by key
   * @param {string} key
   * @returns {Promise<boolean>} - Returns true if file was deleted, false if file did not exist
   */
  async deleteFile(key) {
    const targetPath = this.resolveSafePath(key);

    try {
      await fs.promises.unlink(targetPath);
      return true;
    } catch (err) {
      if (err.code === "ENOENT") {
        return false;
      }
      throw err;
    }
  }
}
