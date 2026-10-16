// Automated test suite for Phase 2 Local Storage Abstraction using node:test
import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { LocalStorageProvider } from "../src/shared/storage/local.storage.js";
import { ValidationError, NotFoundError } from "../src/shared/utils/errors.js";

describe("Phase 2: Local Storage Abstraction", () => {
  let isolatedBaseDir;
  let isolatedTempDir;
  let isolatedStorageDir;
  let storage;

  before(() => {
    // Create an isolated temporary test sandbox in OS temp
    isolatedBaseDir = fs.mkdtempSync(path.join(os.tmpdir(), "readable-storage-test-"));
    isolatedTempDir = path.join(isolatedBaseDir, "temp");
    isolatedStorageDir = path.join(isolatedBaseDir, "documents");

    fs.mkdirSync(isolatedTempDir, { recursive: true });
    fs.mkdirSync(isolatedStorageDir, { recursive: true });

    storage = new LocalStorageProvider(isolatedStorageDir);
  });

  after(() => {
    // Guaranteed cleanup of isolated test directories
    if (isolatedBaseDir && fs.existsSync(isolatedBaseDir)) {
      try {
        fs.rmSync(isolatedBaseDir, { recursive: true, force: true });
      } catch (err) {
        console.error("Failed to clean up test directory:", err);
      }
    }
  });

  // 1. Save and move a file
  it("1. should save and move a temporary file to permanent storage", async () => {
    const tempFile = path.join(isolatedTempDir, "test_1.tmp");
    fs.writeFileSync(tempFile, "%PDF-1.4 sample content for move test");

    const result = await storage.saveFile({
      tempPath: tempFile,
      originalName: "MyReport.pdf",
      mimeType: "application/pdf",
      userId: 101,
    });

    assert.ok(typeof result.key === "string", "Key should be a string");
    assert.match(result.key, /^doc-101-\d+-[a-f0-9-]+\.pdf$/, "Key should have doc-userId-timestamp-uuid format");
    assert.equal(fs.existsSync(tempFile), false, "Temporary source file should no longer exist in temp dir");
    assert.equal(fs.existsSync(path.join(isolatedStorageDir, result.key)), true, "File should exist in permanent storage");
  });

  // 2. Exact content and byte-size preservation
  it("2. should preserve exact byte size and binary content on disk", async () => {
    const tempFile = path.join(isolatedTempDir, "test_2.tmp");
    const originalBuffer = Buffer.from("%PDF-1.4\nBinary\x00\x01\x02\xFFDataPreservationTest\n%%EOF");
    fs.writeFileSync(tempFile, originalBuffer);

    const result = await storage.saveFile({
      tempPath: tempFile,
      originalName: "binary.pdf",
      mimeType: "application/pdf",
      userId: 55,
    });

    const storedPath = path.join(isolatedStorageDir, result.key);
    const diskStat = fs.statSync(storedPath);
    const storedBuffer = fs.readFileSync(storedPath);

    assert.equal(result.size, originalBuffer.length, "Reported size must match original buffer length");
    assert.equal(diskStat.size, originalBuffer.length, "Disk size must match original buffer length");
    assert.equal(Buffer.compare(originalBuffer, storedBuffer), 0, "Stored bytes must strictly match original bytes");
  });

  // 3. Unique storage keys for identical filenames (collision resistance)
  it("3. should generate distinct unique storage keys for identical original filenames", async () => {
    const tempFileA = path.join(isolatedTempDir, "dup_a.tmp");
    const tempFileB = path.join(isolatedTempDir, "dup_b.tmp");
    fs.writeFileSync(tempFileA, "%PDF-1.4 File A");
    fs.writeFileSync(tempFileB, "%PDF-1.4 File B");

    const resultA = await storage.saveFile({ tempPath: tempFileA, originalName: "document.pdf", userId: 1 });
    const resultB = await storage.saveFile({ tempPath: tempFileB, originalName: "document.pdf", userId: 1 });

    assert.notEqual(resultA.key, resultB.key, "Keys must be unique even with identical filenames");
    assert.equal(fs.existsSync(path.join(isolatedStorageDir, resultA.key)), true, "First file must exist");
    assert.equal(fs.existsSync(path.join(isolatedStorageDir, resultB.key)), true, "Second file must exist");
  });

  // 4. Read-stream contents
  it("4. should stream exact file contents and throw NotFoundError for missing keys", async () => {
    const tempFile = path.join(isolatedTempDir, "stream_test.tmp");
    const testContent = "%PDF-1.4 Streaming verification test payload with special characters 🚀";
    fs.writeFileSync(tempFile, testContent);

    const result = await storage.saveFile({
      tempPath: tempFile,
      originalName: "stream.pdf",
      userId: 7,
    });

    const readStream = await storage.getStream(result.key);
    const chunks = [];
    for await (const chunk of readStream) {
      chunks.push(chunk);
    }
    const streamedContent = Buffer.concat(chunks).toString("utf8");
    assert.equal(streamedContent, testContent, "Streamed content must match original content");

    // Missing key should throw NotFoundError
    await assert.rejects(
      async () => {
        await storage.getStream("doc-999-missing-key.pdf");
      },
      (err) => err instanceof NotFoundError && err.statusCode === 404
    );
  });

  // 5. File-existence checks
  it("5. should correctly report file existence for present and absent keys", async () => {
    const tempFile = path.join(isolatedTempDir, "exist_test.tmp");
    fs.writeFileSync(tempFile, "%PDF-1.4 Existence payload");

    const result = await storage.saveFile({ tempPath: tempFile, originalName: "exist.pdf", userId: 12 });

    const exists = await storage.fileExists(result.key);
    assert.equal(exists, true, "fileExists must return true for saved file");

    const doesNotExist = await storage.fileExists("doc-9999-not-found.pdf");
    assert.equal(doesNotExist, false, "fileExists must return false for absent file");
  });

  // 6. Successful and nonexistent-file deletion
  it("6. should delete existing files and handle nonexistent file deletion gracefully", async () => {
    const tempFile = path.join(isolatedTempDir, "del_test.tmp");
    fs.writeFileSync(tempFile, "%PDF-1.4 Deletion test");

    const result = await storage.saveFile({ tempPath: tempFile, originalName: "delete_me.pdf", userId: 9 });
    const storedPath = path.join(isolatedStorageDir, result.key);

    assert.equal(fs.existsSync(storedPath), true, "File must exist before deletion");

    // First deletion should return true
    const deletedFirst = await storage.deleteFile(result.key);
    assert.equal(deletedFirst, true, "deleteFile must return true when file is deleted");
    assert.equal(fs.existsSync(storedPath), false, "File must not exist on disk after deletion");

    // Second deletion should return false without throwing
    const deletedSecond = await storage.deleteFile(result.key);
    assert.equal(deletedSecond, false, "deleteFile must return false when file already does not exist");
  });

  // 7. Path traversal rejection on Windows-compatible paths
  it("7. should reject path traversal attempts on both Windows and POSIX paths", () => {
    const traversalVectors = [
      "../secret.txt",
      "..\\secret.txt",
      "../../etc/passwd",
      "..\\..\\Windows\\win.ini",
      "subfolder/doc.pdf",
      "subfolder\\doc.pdf",
      "C:\\Windows\\System32\\cmd.exe",
      "D:\\Read-Able\\secret.pdf",
      "doc-1..pdf",
      "doc-1\0.pdf",
      "",
      "   ",
      null,
      undefined,
    ];

    for (const vector of traversalVectors) {
      assert.throws(
        () => {
          storage.resolveSafePath(vector);
        },
        (err) => err instanceof ValidationError,
        `Vector ${JSON.stringify(vector)} must be rejected with ValidationError`
      );
    }
  });

  // 8. Missing source files and filesystem failures
  it("8. should reject save operations when source temporary file does not exist", async () => {
    const nonExistentSource = path.join(isolatedTempDir, "ghost_file_" + Date.now() + ".tmp");

    await assert.rejects(
      async () => {
        await storage.saveFile({
          tempPath: nonExistentSource,
          originalName: "fail.pdf",
          userId: 1,
        });
      },
      (err) => err instanceof ValidationError && err.message.includes("does not exist")
    );

    // Verify storage directory has no partial files created
    const storedFiles = fs.readdirSync(isolatedStorageDir);
    assert.equal(
      storedFiles.filter((f) => f.includes("fail.pdf")).length,
      0,
      "No partial files should be written to storage directory on failure"
    );
  });

  // 9. Partial-failure cleanup behavior
  it("9. should support safe compensation rollback cleanup without affecting other files", async () => {
    // Setup a pre-existing permanent file
    const tempFileExisting = path.join(isolatedTempDir, "keep_me.tmp");
    fs.writeFileSync(tempFileExisting, "%PDF-1.4 Existing document to keep");
    const existingDoc = await storage.saveFile({
      tempPath: tempFileExisting,
      originalName: "keep.pdf",
      userId: 1,
    });

    // Save a new file that will simulate a downstream database failure
    const tempFileFailed = path.join(isolatedTempDir, "db_fail.tmp");
    fs.writeFileSync(tempFileFailed, "%PDF-1.4 New file whose DB insert fails");
    const failedDoc = await storage.saveFile({
      tempPath: tempFileFailed,
      originalName: "aborted.pdf",
      userId: 1,
    });

    assert.equal(await storage.fileExists(failedDoc.key), true, "New file initially saved in storage");

    // Execute compensating rollback deletion
    const rollbackResult = await storage.deleteFile(failedDoc.key);
    assert.equal(rollbackResult, true, "Compensating deletion should succeed");
    assert.equal(await storage.fileExists(failedDoc.key), false, "Aborted file must be removed by rollback");

    // Verify the pre-existing file was untouched
    assert.equal(await storage.fileExists(existingDoc.key), true, "Pre-existing file must remain intact");
  });
});
