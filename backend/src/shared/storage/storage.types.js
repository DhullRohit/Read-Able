// JSDoc type definitions defining the unified StorageProvider contract for local and future S3 storage
/**
 * @typedef {Object} SaveFileOptions
 * @property {string} tempPath - Absolute path to the validated temporary file
 * @property {string} originalName - Original filename from the client (e.g. "my-doc.pdf")
 * @property {string} [mimeType] - Validated MIME type (e.g. "application/pdf")
 * @property {number|string} [userId] - Optional authenticated user ID for key prefixing
 */

/**
 * @typedef {Object} SaveFileResult
 * @property {string} key - Unique generated storage key (e.g. "doc-1-1729000000000-uuid.pdf")
 * @property {number} size - File size in bytes verified on disk
 * @property {string} originalName - Original filename
 * @property {string} mimeType - MIME type
 */

/**
 * @typedef {Object} StorageProvider
 * @property {(options: SaveFileOptions) => Promise<SaveFileResult>} saveFile
 * @property {(key: string) => Promise<import("fs").ReadStream>} getStream
 * @property {(key: string) => Promise<boolean>} fileExists
 * @property {(key: string) => Promise<boolean>} deleteFile
 * @property {(key: string) => string} resolveSafePath
 */

export {};
