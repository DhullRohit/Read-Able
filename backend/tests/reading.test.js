// Phase 3: Reading Progress & Session Tracking tests
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const { default: prisma } = await import("../src/config/database.js");
const {
  readingProgressService,
  calculateProgressPercentage,
} = await import("../src/features/reading/reading.service.js");
const {
  getProgress,
  saveProgress,
  getUserProgressList,
} = await import("../src/features/reading/reading.controller.js");
const { ForbiddenError, NotFoundError, ValidationError } = await import(
  "../src/shared/utils/errors.js"
);

describe("Phase 3: Reading Progress Tracking", () => {
  beforeEach(() => {
    readingProgressService._resetStore();
  });

  // -------------------------------------------------------------------------
  // 1. Percentage Calculation Unit Tests
  // -------------------------------------------------------------------------
  describe("Progress Percentage Calculation", () => {
    it("calculates progress percentage accurately and safely", () => {
      assert.equal(calculateProgressPercentage(5, 20), 25);
      assert.equal(calculateProgressPercentage(1, 3), 33);
      assert.equal(calculateProgressPercentage(3, 3), 100);
    });

    it("handles zero, negative, or invalid values without producing NaN or Infinity", () => {
      assert.equal(calculateProgressPercentage(0, 10), 0);
      assert.equal(calculateProgressPercentage(-5, 10), 0);
      assert.equal(calculateProgressPercentage(5, 0), 0);
      assert.equal(calculateProgressPercentage(5, -10), 0);
      assert.equal(calculateProgressPercentage(null, undefined), 0);
      assert.equal(calculateProgressPercentage("abc", "xyz"), 0);
    });

    it("clamps percentages to a maximum of 100%", () => {
      assert.equal(calculateProgressPercentage(15, 10), 100);
      assert.equal(calculateProgressPercentage(999, 50), 100);
    });
  });

  // -------------------------------------------------------------------------
  // 2. Reading Progress Service Tests
  // -------------------------------------------------------------------------
  describe("Reading Progress Service", () => {
    it("saves and retrieves reading progress for a user and document", () => {
      const saved = readingProgressService.saveProgress(1, 101, {
        currentPage: 5,
        totalPages: 20,
      });

      assert.equal(saved.documentId, "101");
      assert.equal(saved.currentPage, 5);
      assert.equal(saved.totalPages, 20);
      assert.equal(saved.percentage, 25);
      assert.ok(saved.lastReadAt);

      const retrieved = readingProgressService.getProgress(1, 101);
      assert.deepEqual(retrieved, saved);
    });

    it("maintains isolated progress across different users for the same document", () => {
      readingProgressService.saveProgress(1, 200, { currentPage: 3, totalPages: 10 });
      readingProgressService.saveProgress(2, 200, { currentPage: 8, totalPages: 10 });

      const user1Progress = readingProgressService.getProgress(1, 200);
      const user2Progress = readingProgressService.getProgress(2, 200);

      assert.equal(user1Progress.currentPage, 3);
      assert.equal(user1Progress.percentage, 30);

      assert.equal(user2Progress.currentPage, 8);
      assert.equal(user2Progress.percentage, 80);
    });

    it("maintains separate progress across different documents for the same user", () => {
      readingProgressService.saveProgress(1, 301, { currentPage: 2, totalPages: 10 });
      readingProgressService.saveProgress(1, 302, { currentPage: 7, totalPages: 10 });

      assert.equal(readingProgressService.getProgress(1, 301).currentPage, 2);
      assert.equal(readingProgressService.getProgress(1, 302).currentPage, 7);

      const all = readingProgressService.getAllProgressForUser(1);
      assert.equal(Object.keys(all).length, 2);
      assert.ok(all["301"]);
      assert.ok(all["302"]);
    });

    it("updates progress when advancing pages without losing totalPages", () => {
      readingProgressService.saveProgress(1, 401, { currentPage: 1, totalPages: 50 });
      readingProgressService.saveProgress(1, 401, { currentPage: 10 });

      const updated = readingProgressService.getProgress(1, 401);
      assert.equal(updated.currentPage, 10);
      assert.equal(updated.totalPages, 50);
      assert.equal(updated.percentage, 20);
    });

    it("clears progress when document is deleted", () => {
      readingProgressService.saveProgress(1, 501, { currentPage: 4, totalPages: 12 });
      assert.ok(readingProgressService.getProgress(1, 501));

      readingProgressService.clearProgress(1, 501);
      assert.equal(readingProgressService.getProgress(1, 501), null);
    });
  });

  // -------------------------------------------------------------------------
  // 3. Controller & Security Verification Tests
  // -------------------------------------------------------------------------
  describe("Controller & Document Ownership Security", () => {
    let originalFindUnique;

    before(() => {
      originalFindUnique = prisma.document.findUnique.bind(prisma.document);
    });

    after(() => {
      prisma.document.findUnique = originalFindUnique;
    });

    it("allows the owner to save and get reading progress", async () => {
      const mockDoc = { id: 601, userId: 10, title: "Owner Doc" };
      prisma.document.findUnique = async () => mockDoc;

      let savedResult;
      const mockRes = {
        status(code) {
          assert.equal(code, 200);
          return this;
        },
        json(body) {
          savedResult = body;
          return this;
        },
      };

      // Save progress
      await saveProgress(
        {
          params: { documentId: "601" },
          user: { id: 10 },
          body: { currentPage: 4, totalPages: 10 },
        },
        mockRes,
        (err) => {
          if (err) throw err;
        }
      );

      assert.equal(savedResult.success, true);
      assert.equal(savedResult.data.currentPage, 4);
      assert.equal(savedResult.data.percentage, 40);

      // Get progress
      let getResult;
      const mockGetRes = {
        status(code) {
          assert.equal(code, 200);
          return this;
        },
        json(body) {
          getResult = body;
          return this;
        },
      };

      await getProgress(
        {
          params: { documentId: "601" },
          user: { id: 10 },
        },
        mockGetRes,
        (err) => {
          if (err) throw err;
        }
      );

      assert.equal(getResult.success, true);
      assert.equal(getResult.data.currentPage, 4);
    });

    it("forbids another user from accessing reading progress of a document they do not own", async () => {
      const mockDoc = { id: 701, userId: 99, title: "Secret Doc" };
      prisma.document.findUnique = async () => mockDoc;

      let caughtError = null;
      await getProgress(
        {
          params: { documentId: "701" },
          user: { id: 5 }, // Different user
        },
        {},
        (err) => {
          caughtError = err;
        }
      );

      assert.ok(caughtError instanceof ForbiddenError);
      assert.equal(caughtError.statusCode, 403);
    });

    it("rejects saving progress with invalid currentPage (< 1)", async () => {
      const mockDoc = { id: 801, userId: 10, title: "Doc" };
      prisma.document.findUnique = async () => mockDoc;

      let caughtError = null;
      await saveProgress(
        {
          params: { documentId: "801" },
          user: { id: 10 },
          body: { currentPage: 0, totalPages: 10 },
        },
        {},
        (err) => {
          caughtError = err;
        }
      );

      assert.ok(caughtError instanceof ValidationError);
      assert.equal(caughtError.statusCode, 400);
    });

    it("throws NotFoundError when document does not exist in database", async () => {
      prisma.document.findUnique = async () => null;

      let caughtError = null;
      await getProgress(
        {
          params: { documentId: "9999" },
          user: { id: 1 },
        },
        {},
        (err) => {
          caughtError = err;
        }
      );

      assert.ok(caughtError instanceof NotFoundError);
      assert.equal(caughtError.statusCode, 404);
    });
  });
});
