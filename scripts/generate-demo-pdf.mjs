#!/usr/bin/env node
/**
 * generate-demo-pdf.mjs
 *
 * Generates a minimal valid multi-page PDF for local Reader development/testing.
 * Uses only Node.js built-ins — no extra npm packages required.
 *
 * Output: frontend/public/demo/sample.pdf
 *
 * Run:  node scripts/generate-demo-pdf.mjs
 *
 * NOTE: The output directory is gitignored. This file should NEVER be committed.
 */

import { writeFileSync, mkdirSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "..", "frontend", "public", "demo");
const OUT_FILE = join(OUT_DIR, "sample.pdf");

// ---------------------------------------------------------------------------
// Minimal PDF builder — pure text-based PDF 1.4 structure
// ---------------------------------------------------------------------------

const PAGES = [
  {
    title: "Introduction",
    body: [
      "Welcome to ReadAble — your accessible reading companion.",
      "",
      "This sample document is used for local development and testing of",
      "the ReadAble PDF Reader. It is never committed to the repository.",
      "",
      "ReadAble helps users with dyslexia, low vision, and other reading",
      "challenges by offering customisable fonts, contrast themes, zoom",
      "controls, and seamless reading-progress resume.",
      "",
      "Navigate using the Previous / Next buttons or type a page number",
      "directly into the input field. Your progress is saved automatically",
      "and resumed when you return.",
    ],
  },
  {
    title: "Chapter 1 — Getting Started",
    body: [
      "Chapter 1: Getting Started with ReadAble",
      "",
      "1.1  Creating an account",
      "     Sign up with your email address or phone number.",
      "     A verification token is sent to confirm your identity.",
      "",
      "1.2  Uploading your first document",
      "     Tap the Upload button on the Dashboard.",
      "     Supported formats: PDF, TXT, and image files.",
      "     Files are stored securely and linked to your account.",
      "",
      "1.3  Opening the Reader",
      "     Click any document in your library to open the Reader view.",
      "     The Reader remembers the last page you were on.",
    ],
  },
  {
    title: "Chapter 2 — Reading Features",
    body: [
      "Chapter 2: Reading Features",
      "",
      "2.1  Page navigation",
      "     Use the Previous and Next buttons to move between pages.",
      "     Jump directly to any page by typing the number and pressing Enter.",
      "",
      "2.2  Zoom controls",
      "     Increase or decrease zoom with the + / - buttons in the toolbar.",
      "     Reset zoom to 100% at any time.",
      "",
      "2.3  Light / Dark theme",
      "     Toggle between light and dark reading themes.",
      "     Your preference is saved across sessions.",
      "",
      "2.4  Reading progress",
      "     Progress is saved automatically every time you turn a page.",
      "     Closing the tab or navigating away also triggers a save.",
      "     When you return, you resume exactly where you left off.",
    ],
  },
  {
    title: "Chapter 3 — Accessibility",
    body: [
      "Chapter 3: Accessibility",
      "",
      "ReadAble is designed with accessibility at its core.",
      "",
      "3.1  OpenDyslexic font",
      "     The dashboard supports OpenDyslexic, a typeface designed to",
      "     increase readability for readers with dyslexia.",
      "",
      "3.2  High contrast mode",
      "     Choose from Standard, High Contrast, or Cream Background",
      "     colour schemes in the Reading Settings panel.",
      "",
      "3.3  Text size",
      "     Adjust the dashboard text size to suit your preference.",
      "     Sizes are persisted between sessions.",
      "",
      "3.4  Keyboard navigation",
      "     Use the left/right arrow keys to navigate pages in the Reader.",
    ],
  },
  {
    title: "Conclusion",
    body: [
      "Conclusion",
      "",
      "Thank you for using ReadAble.",
      "",
      "This sample document demonstrated the core reading experience:",
      "  - Multi-page PDF rendering",
      "  - Page navigation (previous / next / jump)",
      "  - Zoom and theme controls",
      "  - Automatic reading progress save and resume",
      "",
      "When Phase 1 (document upload) and Phase 2 (text extraction) are",
      "complete, real documents uploaded by users will appear here instead",
      "of this demo file.",
      "",
      "Happy reading!",
      "",
      "— The ReadAble Team",
    ],
  },
];

// ---------------------------------------------------------------------------
// Build a raw PDF byte string
// ---------------------------------------------------------------------------

function buildPdf(pages) {
  const objects = [];
  let xref = [];

  function addObj(content) {
    const n = objects.length + 1;
    objects.push({ n, content });
    return n;
  }

  // Each page content stream
  const contentIds = pages.map((page) => {
    const lines = [`BT`, `/F1 16 Tf`, `50 750 Td`, `20 TL`];
    // Title in larger font
    lines.push(`/F1 16 Tf`);
    lines.push(`(${escapePdf(page.title)}) Tj`);
    lines.push(`/F1 12 Tf`);
    lines.push(`0 -30 Td`);
    for (const line of page.body) {
      lines.push(`(${escapePdf(line)}) Tj T*`);
    }
    lines.push(`ET`);
    const stream = lines.join("\n");
    return addObj(
      `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`
    );
  });

  // Font
  const fontId = addObj(
    `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>`
  );

  // Resources
  const resourcesId = addObj(
    `<< /Font << /F1 ${fontId} 0 R >> >>`
  );

  // Page objects
  const pageIds = pages.map((_, i) => {
    return addObj(
      `<< /Type /Page /MediaBox [0 0 595 842] /Resources ${resourcesId} 0 R /Contents ${contentIds[i]} 0 R /Parent 0 >>`
    );
  });

  // Pages (we'll back-patch the parent refs)
  const kidsStr = pageIds.map((id) => `${id} 0 R`).join(" ");
  const pagesId = addObj(
    `<< /Type /Pages /Kids [${kidsStr}] /Count ${pages.length} >>`
  );

  // Back-patch /Parent in each page object
  objects.forEach((obj, idx) => {
    if (pageIds.includes(obj.n)) {
      objects[idx].content = obj.content.replace(
        "/Parent 0",
        `/Parent ${pagesId} 0 R`
      );
    }
  });

  // Catalog
  const catalogId = addObj(
    `<< /Type /Catalog /Pages ${pagesId} 0 R >>`
  );

  // Build byte string
  let out = "%PDF-1.4\n";
  xref = [];

  for (const obj of objects) {
    xref.push(out.length);
    out += `${obj.n} 0 obj\n${obj.content}\nendobj\n`;
  }

  const xrefOffset = out.length;
  out += `xref\n0 ${objects.length + 1}\n`;
  out += `0000000000 65535 f \n`;
  for (const offset of xref) {
    out += `${String(offset).padStart(10, "0")} 00000 n \n`;
  }
  out += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\n`;
  out += `startxref\n${xrefOffset}\n%%EOF\n`;

  return out;
}

function escapePdf(str) {
  return str
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

// ---------------------------------------------------------------------------
// Write output
// ---------------------------------------------------------------------------

mkdirSync(OUT_DIR, { recursive: true });
const pdfContent = buildPdf(PAGES);
writeFileSync(OUT_FILE, pdfContent, "latin1");

console.log(`✅  Demo PDF written to: ${OUT_FILE}`);
console.log(`    Pages: ${PAGES.length}`);
console.log(`    Size:  ${(pdfContent.length / 1024).toFixed(1)} KB`);
console.log(`\n⚠️  This file is gitignored. Do not commit it.`);
