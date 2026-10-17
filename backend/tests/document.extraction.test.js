// Phase 2: Document Text Extraction Pipeline tests
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
const { normalizeText, extractParagraphs } = await import(
  "../src/features/documents/extraction/text-normalizer.js"
);
const { extractTextFromPdfBuffer } = await import(
  "../src/features/documents/extraction/pdf-extractor.js"
);
const extractionService = await import(
  "../src/features/documents/extraction/document-extraction.service.js"
);
const { NotFoundError, ForbiddenError, ValidationError } = await import(
  "../src/shared/utils/errors.js"
);

/**
 * Generates a valid minimal PDF 1.4 buffer with custom page texts for testing.
 * @param {string[]} pageTexts
 * @returns {Buffer}
 */
function createTestPdf(pageTexts) {
  const objects = [];
  function addObj(content) {
    const n = objects.length + 1;
    objects.push({ n, content });
    return n;
  }

  const contentIds = pageTexts.map((text) => {
    if (!text || text.trim().length === 0) {
      // Empty content stream for empty/image-only pages
      return addObj("<< /Length 0 >>\nstream\n\nendstream");
    }

    const lines = ["BT", "/F1 12 Tf", "50 750 Td", "15 TL"];
    for (const line of text.split("\n")) {
      const escaped = line
        .replace(/\\/g, "\\\\")
        .replace(/\(/g, "\\(")
        .replace(/\)/g, "\\)");
      lines.push("(" + escaped + ") Tj T*");
    }
    lines.push("ET");
    const stream = lines.join("\n");
    return addObj(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
  });

  const fontId = addObj(
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>"
  );
  const resId = addObj(`<< /Font << /F1 ${fontId} 0 R >> >>`);

  const pageIds = pageTexts.map((_, i) => {
    return addObj(
      `<< /Type /Page /MediaBox [0 0 595 842] /Resources ${resId} 0 R /Contents ${contentIds[i]} 0 R /Parent 0 >>`
    );
  });

  const kidsStr = pageIds.map((id) => `${id} 0 R`).join(" ");
  const pagesId = addObj(
    `<< /Type /Pages /Kids [${kidsStr}] /Count ${pageTexts.length} >>`
  );

  for (const pId of pageIds) {
    objects[pId - 1].content = objects[pId - 1].content.replace(
      "/Parent 0",
      `/Parent ${pagesId} 0 R`
    );
  }

  const catalogId = addObj(`<< /Type /Catalog /Pages ${pagesId} 0 R >>`);

  let out = "%PDF-1.4\n";
  const xref = [];
  for (const obj of objects) {
    xref.push(out.length);
    out += `${obj.n} 0 obj\n${obj.content}\nendobj\n`;
  }

  const xrefOffset = out.length;
  out += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of xref) {
    out += `${String(offset).padStart(10, "0")} 00000 n \n`;
  }
  out += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  return Buffer.from(out, "latin1");
}

describe("Phase 2: Document Text Extraction Pipeline", () => {
  // -------------------------------------------------------------------------
  // 1. Text Normalization Unit Tests
  // -------------------------------------------------------------------------
  describe("Text Normalization", () => {
    it("cleans excessive horizontal whitespace and trims trailing spaces", () => {
      const raw = "This    is   a    sentence with   excessive    spaces.   ";
      const normalized = normalizeText(raw);
      assert.equal(normalized, "This is a sentence with excessive spaces.");
    });

    it("reduces excessive blank lines to a maximum of one separating line", () => {
      const raw = "Paragraph 1\n\n\n\n\nParagraph 2\n\n\nParagraph 3";
      const normalized = normalizeText(raw);
      assert.equal(normalized, "Paragraph 1\n\nParagraph 2\n\nParagraph 3");
    });

    it("preserves headings and numbered/bulleted lists", () => {
      const raw = "1. Introduction\n2. Methodology\n   2.1 Data Collection\n3. Results";
      const normalized = normalizeText(raw);
      assert.equal(
        normalized,
        "1. Introduction\n2. Methodology\n   2.1 Data Collection\n3. Results"
      );
    });

    it("preserves code blocks and indentation without destroying syntax", () => {
      const raw = "for(int i = 0; i < n; i++) {\n    int count = i * 2;\n}";
      const normalized = normalizeText(raw);
      assert.equal(
        normalized,
        "for(int i = 0; i < n; i++) {\n    int count = i * 2;\n}"
      );
    });

    it("unifies carriage returns and converts special non-breaking spaces", () => {
      const raw = "Line 1\r\nLine 2\rLine\u00A03\u2002with\u3000spaces";
      const normalized = normalizeText(raw);
      assert.equal(normalized, "Line 1\nLine 2\nLine 3 with spaces");
    });

    it("handles empty or whitespace-only inputs gracefully", () => {
      assert.equal(normalizeText(""), "");
      assert.equal(normalizeText("   \n\n  \t  "), "");
      assert.equal(normalizeText(null), "");
      assert.deepEqual(extractParagraphs(""), []);
      assert.deepEqual(extractParagraphs(null), []);
    });

    it("segments paragraphs by double newlines correctly", () => {
      const text = "Heading\n\nFirst paragraph here.\n\nSecond paragraph here.";
      const paragraphs = extractParagraphs(text);
      assert.deepEqual(paragraphs, [
        "Heading",
        "First paragraph here.",
        "Second paragraph here.",
      ]);
    });
  });

  // -------------------------------------------------------------------------
  // 2. Low-level PDF Extraction Unit Tests
  // -------------------------------------------------------------------------
  describe("PDF Text Extraction", () => {
    it("extracts text from a single-page PDF", async () => {
      const pdf = createTestPdf(["Single page document content"]);
      const pages = await extractTextFromPdfBuffer(pdf);
      assert.equal(pages.length, 1);
      assert.equal(pages[0].pageNumber, 1);
      assert.match(pages[0].rawText, /Single page document content/);
    });

    it("extracts text page-by-page preserving strict page boundaries", async () => {
      const pdf = createTestPdf([
        "Page one content",
        "Page two content",
        "Page three content",
      ]);
      const pages = await extractTextFromPdfBuffer(pdf);
      assert.equal(pages.length, 3);
      assert.equal(pages[0].pageNumber, 1);
      assert.match(pages[0].rawText, /Page one content/);
      assert.doesNotMatch(pages[0].rawText, /Page two/);

      assert.equal(pages[1].pageNumber, 2);
      assert.match(pages[1].rawText, /Page two content/);

      assert.equal(pages[2].pageNumber, 3);
      assert.match(pages[2].rawText, /Page three content/);
    });

    it("handles empty pages without crashing and returns empty string", async () => {
      const pdf = createTestPdf(["Valid page", "", "Another valid page"]);
      const pages = await extractTextFromPdfBuffer(pdf);
      assert.equal(pages.length, 3);
      assert.equal(pages[1].pageNumber, 2);
      assert.equal(pages[1].rawText, "");
    });

    it("handles image-only PDF with zero extractable text gracefully", async () => {
      const pdf = createTestPdf(["", ""]);
      const pages = await extractTextFromPdfBuffer(pdf);
      assert.equal(pages.length, 2);
      assert.equal(pages[0].rawText, "");
      assert.equal(pages[1].rawText, "");
    });

    it("rejects invalid or corrupted PDF buffers cleanly with ValidationError", async () => {
      const garbage = Buffer.from("Not a real PDF structure at all");
      await assert.rejects(
        () => extractTextFromPdfBuffer(garbage),
        (err) => err instanceof ValidationError
      );
    });

    it("rejects empty / zero-byte buffers with ValidationError", async () => {
      await assert.rejects(
        () => extractTextFromPdfBuffer(Buffer.alloc(0)),
        (err) => err instanceof ValidationError
      );
    });
  });

  // -------------------------------------------------------------------------
  // 3. Document Extraction Pipeline & Service Tests
  // -------------------------------------------------------------------------
  describe("Extraction Service & Storage Integration", () => {
    let isolatedBaseDir;
    let isolatedStorageDir;
    let originalGetStream;
    let originalFileExists;
    let originalFindUnique;

    before(() => {
      isolatedBaseDir = fs.mkdtempSync(
        path.join(os.tmpdir(), "readable-phase2-test-")
      );
      isolatedStorageDir = path.join(isolatedBaseDir, "documents");
      fs.mkdirSync(isolatedStorageDir, { recursive: true });

      const testProvider = new LocalStorageProvider(isolatedStorageDir);

      originalGetStream = storageService.getStream;
      originalFileExists = storageService.fileExists;
      originalFindUnique = prisma.document.findUnique.bind(prisma.document);

      storageService.getStream = (key) => testProvider.getStream(key);
      storageService.fileExists = (key) => testProvider.fileExists(key);
    });

    after(() => {
      storageService.getStream = originalGetStream;
      storageService.fileExists = originalFileExists;
      prisma.document.findUnique = originalFindUnique;

      if (isolatedBaseDir && fs.existsSync(isolatedBaseDir)) {
        fs.rmSync(isolatedBaseDir, { recursive: true, force: true });
      }
    });

    it("extracts document from storage, caches result, and sets status to PROCESSED", async () => {
      const testKey = "doc-test-extraction-1.pdf";
      const pdfBytes = createTestPdf([
        "Chapter 1\nIntroduction to ReadAble",
        "Chapter 2\nAdvanced Reading Features",
      ]);
      fs.writeFileSync(path.join(isolatedStorageDir, testKey), pdfBytes);

      const mockDoc = {
        id: 101,
        title: "Test Doc",
        fileName: "test.pdf",
        s3Key: testKey,
        fileSize: pdfBytes.length,
        mimeType: "application/pdf",
        userId: 1,
      };

      prisma.document.findUnique = async () => mockDoc;

      // First call performs extraction
      const content = await extractionService.getDocumentContent(101, 1);

      assert.equal(content.documentId, 101);
      assert.equal(content.status, "PROCESSED");
      assert.equal(content.totalPages, 2);
      assert.equal(content.pages.length, 2);
      assert.equal(content.pages[0].pageNumber, 1);
      assert.match(content.pages[0].text, /Chapter 1/);
      assert.equal(content.pages[1].pageNumber, 2);
      assert.match(content.pages[1].text, /Chapter 2/);
      assert.ok(content.extractedAt);

      // Status helper returns PROCESSED
      assert.equal(
        extractionService.getDocumentProcessingStatus(101),
        "PROCESSED"
      );

      // Invalidation clears cache
      extractionService.invalidateDocumentContent(101);
      assert.equal(
        extractionService.getDocumentProcessingStatus(101),
        null
      );
    });

    it("throws NotFoundError when document file is missing in storage", async () => {
      const mockDoc = {
        id: 102,
        title: "Missing File Doc",
        fileName: "missing.pdf",
        s3Key: "non-existent-key.pdf",
        userId: 1,
      };

      prisma.document.findUnique = async () => mockDoc;

      await assert.rejects(
        () => extractionService.getDocumentContent(102, 1),
        (err) => err instanceof NotFoundError
      );
    });

    it("records status FAILED when stored PDF is corrupted", async () => {
      const corruptedKey = "doc-corrupted.pdf";
      fs.writeFileSync(
        path.join(isolatedStorageDir, corruptedKey),
        Buffer.from("corrupted not a valid pdf header")
      );

      const mockDoc = {
        id: 103,
        title: "Corrupted Doc",
        fileName: "corrupt.pdf",
        s3Key: corruptedKey,
        userId: 1,
      };

      prisma.document.findUnique = async () => mockDoc;

      await assert.rejects(
        () => extractionService.getDocumentContent(103, 1),
        (err) => err instanceof ValidationError
      );

      assert.equal(
        extractionService.getDocumentProcessingStatus(103),
        "FAILED"
      );
    });
  });

  // -------------------------------------------------------------------------
  // 4. Security & Authorization Tests
  // -------------------------------------------------------------------------
  describe("Security & Ownership Verification", () => {
    let originalFindUnique;

    before(() => {
      originalFindUnique = prisma.document.findUnique.bind(prisma.document);
    });

    after(() => {
      prisma.document.findUnique = originalFindUnique;
    });

    it("forbids access when a user attempts to access another user's document", async () => {
      const mockDoc = {
        id: 201,
        title: "Owner Doc",
        fileName: "owner.pdf",
        s3Key: "owner-key.pdf",
        userId: 99, // Owned by user 99
      };

      prisma.document.findUnique = async () => mockDoc;

      // User 42 tries to access user 99's document
      await assert.rejects(
        () => extractionService.getDocumentContent(201, 42),
        (err) => err instanceof ForbiddenError
      );
    });

    it("throws NotFoundError when requesting a non-existent document ID", async () => {
      prisma.document.findUnique = async () => null;

      await assert.rejects(
        () => extractionService.getDocumentContent(99999, 1),
        (err) => err instanceof NotFoundError
      );
    });
  });
});
