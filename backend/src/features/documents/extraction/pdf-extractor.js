/**
 * pdf-extractor.js
 *
 * Low-level PDF text extraction using pdfjs-dist.
 * Extracts text on a strict page-by-page basis, preserving page boundaries.
 * Handles single-page, multi-page, empty pages, image-only pages, and corrupted PDFs.
 */

import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { ValidationError } from "../../../shared/utils/errors.js";

// Locate standard_fonts inside pdfjs-dist to eliminate font warnings
let standardFontDataUrl;
try {
  const distDir = path.dirname(fileURLToPath(import.meta.resolve("pdfjs-dist")));
  const fontsDir = path.join(distDir, "standard_fonts");
  standardFontDataUrl = pathToFileURL(fontsDir).href + "/";
} catch {
  // Fallback if import.meta.resolve behaves unexpectedly in some test environments
  standardFontDataUrl = undefined;
}

/**
 * Reconstructs continuous page text from PDF text items.
 * Accounts for vertical baseline changes (newlines), explicit EOL markers, and horizontal word gaps.
 *
 * @param {Array<Object>} items - Array of text items from pdfjs getTextContent()
 * @returns {string}
 */
export function reconstructPageText(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return "";
  }

  let pageText = "";
  let lastY = null;
  let lastX = null;
  let lastWidth = 0;

  for (const item of items) {
    if (typeof item.str !== "string") continue;

    const x = item.transform ? item.transform[4] : null;
    const y = item.transform ? item.transform[5] : null;

    // Detect line break via vertical displacement
    if (lastY !== null && y !== null && Math.abs(y - lastY) > 5) {
      if (!pageText.endsWith("\n")) {
        pageText += "\n";
      }
      lastX = null;
    } else if (lastX !== null && lastY !== null && x !== null) {
      // Detect missing word space via horizontal gap
      const gap = x - (lastX + lastWidth);
      if (gap > 2 && !pageText.endsWith(" ") && !item.str.startsWith(" ")) {
        pageText += " ";
      }
    }

    pageText += item.str;

    // Detect explicit EOL flag
    if (item.hasEOL && !pageText.endsWith("\n")) {
      pageText += "\n";
      lastX = null;
      lastY = null;
      continue;
    }

    lastX = x;
    lastY = y;
    lastWidth = item.width || 0;
  }

  return pageText;
}

/**
 * Extracts raw page text array from a PDF buffer or Uint8Array.
 *
 * @param {Buffer|Uint8Array} pdfBuffer
 * @returns {Promise<Array<{ pageNumber: number, rawText: string }>>}
 */
export async function extractTextFromPdfBuffer(pdfBuffer) {
  if (!pdfBuffer || pdfBuffer.length === 0) {
    throw new ValidationError("Invalid or empty PDF file");
  }

  let data;
  if (typeof Buffer !== "undefined" && Buffer.isBuffer(pdfBuffer)) {
    data = new Uint8Array(pdfBuffer.buffer, pdfBuffer.byteOffset, pdfBuffer.byteLength);
  } else if (pdfBuffer instanceof Uint8Array) {
    data = pdfBuffer;
  } else {
    data = new Uint8Array(pdfBuffer);
  }

  let loadingTask;
  let doc;

  try {
    loadingTask = pdfjs.getDocument({
      data,
      standardFontDataUrl,
      verbosity: pdfjs.VerbosityLevel.ERRORS,
      isEvalSupported: false,
      useSystemFonts: true,
    });

    doc = await loadingTask.promise;
    const numPages = doc.numPages;
    const pages = [];

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      let page;
      try {
        page = await doc.getPage(pageNum);
        const textContent = await page.getTextContent();
        const rawText = reconstructPageText(textContent.items);

        pages.push({
          pageNumber: pageNum,
          rawText,
        });
      } finally {
        if (page) {
          page.cleanup();
        }
      }
    }

    return pages;
  } catch (err) {
    if (err instanceof ValidationError) {
      throw err;
    }
    // Handle pdfjs errors gracefully without leaking internal library stack traces
    const msg = err?.message || "";
    if (msg.includes("Invalid PDF") || msg.includes("corrupted") || err?.name === "InvalidPDFException") {
      throw new ValidationError("Invalid or corrupted PDF file");
    }
    if (msg.includes("password") || err?.name === "PasswordException") {
      throw new ValidationError("Password-protected PDFs are not supported");
    }

    throw new ValidationError(`Failed to extract text from PDF: ${msg || "unreadable file format"}`);
  } finally {
    if (doc) {
      try {
        await doc.cleanup();
      } catch {
        // ignore cleanup error
      }
    }
    if (loadingTask) {
      try {
        await loadingTask.destroy();
      } catch {
        // ignore destroy error
      }
    }
  }
}
