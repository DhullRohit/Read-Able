// Focused Phase 1 checks for createDocumentFromFile (no HTTP server, no unidentified DB writes)
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const { default: prisma } = await import("../src/config/database.js");
const { default: storageService, LocalStorageProvider } = await import(
  "../src/shared/storage/storage.service.js"
);
const documentService = await import("../src/features/documents/document.service.js");

describe("Phase 1: upload file + document metadata", () => {
  let isolatedBaseDir;
  let isolatedTempDir;
  let isolatedStorageDir;
  let originalCreate;
  let originalSaveFile;
  let originalDeleteFile;
  let originalFileExists;
  let originalGetStream;
  let originalResolveSafePath;
  let lastSavedKey;

  const writeTempPdf = (name, contents) => {
    const tempPath = path.join(isolatedTempDir, name);
    fs.writeFileSync(tempPath, contents);
    return tempPath;
  };

  before(() => {
    isolatedBaseDir = fs.mkdtempSync(path.join(os.tmpdir(), "readable-upload-phase1-"));
    isolatedTempDir = path.join(isolatedBaseDir, "temp");
    isolatedStorageDir = path.join(isolatedBaseDir, "documents");
    fs.mkdirSync(isolatedTempDir, { recursive: true });
    fs.mkdirSync(isolatedStorageDir, { recursive: true });

    const isolatedProvider = new LocalStorageProvider(isolatedStorageDir);

    originalSaveFile = storageService.saveFile;
    originalDeleteFile = storageService.deleteFile;
    originalFileExists = storageService.fileExists;
    originalGetStream = storageService.getStream;
    originalResolveSafePath = storageService.resolveSafePath;
    originalCreate = prisma.document.create.bind(prisma.document);

    storageService.saveFile = async (options) => {
      const result = await isolatedProvider.saveFile(options);
      lastSavedKey = result.key;
      return result;
    };
    storageService.deleteFile = (key) => isolatedProvider.deleteFile(key);
    storageService.fileExists = (key) => isolatedProvider.fileExists(key);
    storageService.getStream = (key) => isolatedProvider.getStream(key);
    storageService.resolveSafePath = (key) => isolatedProvider.resolveSafePath(key);
  });

  after(async () => {
    prisma.document.create = originalCreate;
    storageService.saveFile = originalSaveFile;
    storageService.deleteFile = originalDeleteFile;
    storageService.fileExists = originalFileExists;
    storageService.getStream = originalGetStream;
    storageService.resolveSafePath = originalResolveSafePath;

    try {
      await prisma.$disconnect();
    } catch {
      // ignore if this suite never opened a DB connection
    }

    if (isolatedBaseDir && fs.existsSync(isolatedBaseDir)) {
      fs.rmSync(isolatedBaseDir, { recursive: true, force: true });
    }
  });

  it("saves the PDF, records owner and file metadata, and does not use the client filename as the storage key", async () => {
    const pdfBytes = Buffer.from("%PDF-1.4 focused upload test\n%%EOF");
    const tempPath = writeTempPdf("upload-success.tmp", pdfBytes);
    lastSavedKey = null;

    prisma.document.create = async ({ data }) => ({
      id: 42,
      ...data,
      createdAt: new Date("2026-10-15T00:00:00.000Z"),
      updatedAt: new Date("2026-10-15T00:00:00.000Z"),
    });

    const document = await documentService.createDocumentFromFile({
      userId: 17,
      file: {
        path: tempPath,
        originalname: "Quarterly Report.pdf",
        mimetype: "application/pdf",
      },
      title: "Q3 Report",
    });

    assert.equal(document.id, 42);
    assert.equal(document.userId, 17);
    assert.equal(document.title, "Q3 Report");
    assert.equal(document.fileName, "Quarterly Report.pdf");
    assert.equal(document.fileSize, pdfBytes.length);
    assert.equal(document.mimeType, "application/pdf");
    assert.equal(document.s3Key, lastSavedKey);
    assert.notEqual(document.s3Key, "Quarterly Report.pdf");
    assert.match(document.s3Key, /^doc-17-\d+-[a-f0-9-]+\.pdf$/);
    assert.equal(fs.existsSync(tempPath), false, "temp file should be moved out of the temp directory");
    assert.equal(await storageService.fileExists(document.s3Key), true);
    assert.equal(fs.readFileSync(path.join(isolatedStorageDir, document.s3Key)).equals(pdfBytes), true);
  });

  it("deletes the stored file when PostgreSQL insert fails after saveFile", async () => {
    const tempPath = writeTempPdf("upload-rollback.tmp", "%PDF-1.4 rollback\n%%EOF");
    lastSavedKey = null;

    prisma.document.create = async () => {
      throw Object.assign(new Error("insert failed"), { code: "P2003" });
    };

    await assert.rejects(
      () =>
        documentService.createDocumentFromFile({
          userId: 17,
          file: {
            path: tempPath,
            originalname: "orphan_prevent.pdf",
            mimetype: "application/pdf",
          },
          title: "Will Fail",
        }),
      (err) => err && err.code === "P2003"
    );

    assert.ok(lastSavedKey, "saveFile must produce a key before the database failure");
    assert.equal(await storageService.fileExists(lastSavedKey), false);
    assert.equal(fs.existsSync(path.join(isolatedStorageDir, lastSavedKey)), false);
  });
});
