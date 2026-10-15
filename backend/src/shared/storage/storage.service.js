// Unified storage service facade delegating to the configured storage provider
import { LocalStorageProvider } from "./local.storage.js";

// Initialize default storage provider (LocalStorageProvider)
const defaultProvider = new LocalStorageProvider();

export const storageService = {
  /**
   * @param {import("./storage.types.js").SaveFileOptions} options
   * @returns {Promise<import("./storage.types.js").SaveFileResult>}
   */
  saveFile: (options) => defaultProvider.saveFile(options),

  /**
   * @param {string} key
   * @returns {Promise<import("fs").ReadStream>}
   */
  getStream: (key) => defaultProvider.getStream(key),

  /**
   * @param {string} key
   * @returns {Promise<boolean>}
   */
  fileExists: (key) => defaultProvider.fileExists(key),

  /**
   * @param {string} key
   * @returns {Promise<boolean>}
   */
  deleteFile: (key) => defaultProvider.deleteFile(key),

  /**
   * @param {string} key
   * @returns {string}
   */
  resolveSafePath: (key) => defaultProvider.resolveSafePath(key),
};

export { LocalStorageProvider };
export default storageService;
