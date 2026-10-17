/**
 * documentSource.ts
 *
 * Resolves a document ID into a DocumentReaderSource consumed by the Reader.
 * Integrates directly with Phase 1 (PDF streaming) and Phase 2 (Text extraction).
 */

import { documentApi } from "@/lib/api";

export interface ExtractedPage {
  pageNumber: number;
  text: string;
  paragraphs: string[];
}

export interface DocumentReaderSource {
  /** Unique document identifier */
  documentId: string;
  /** Human-readable title shown in the Reader toolbar */
  title: string;
  /** Original filename if available */
  fileName?: string;
  /**
   * URL string (relative or absolute) or ArrayBuffer of PDF bytes.
   */
  pdfSource: string | ArrayBuffer;
  /**
   * Structured page content extracted by Phase 2 pipeline.
   */
  extractedPages?: ExtractedPage[];
  /**
   * Total known page count if provided by Phase 2.
   */
  totalPages?: number;
}

// ---------------------------------------------------------------------------
// Demo source — local dev / testing fallback
// ---------------------------------------------------------------------------
const DEMO_SOURCES: Record<string, Omit<DocumentReaderSource, "documentId">> = {
  demo: {
    title: "ReadAble — Sample Document (Demo)",
    fileName: "sample.pdf",
    pdfSource: "/demo/sample.pdf",
  },
};

/**
 * Resolves a document ID to a DocumentReaderSource.
 * Connects to Phase 1 for PDF streaming and Phase 2 for extracted page content.
 */
export async function resolveDocumentSource(
  id: string
): Promise<DocumentReaderSource | null> {
  // Support demo for local dev
  const demo = DEMO_SOURCES[id];
  if (demo) {
    return { documentId: id, ...demo };
  }

  const numId = parseInt(id, 10);
  if (isNaN(numId) || numId <= 0) {
    return null;
  }

  // Fetch document metadata from Phase 1
  const docRes = await documentApi.getById(numId);
  const doc = docRes.data?.data;
  if (!doc) {
    return null;
  }

  // Attempt to fetch Phase 2 extracted page content
  let extractedPages: ExtractedPage[] = [];
  let totalPages = 0;

  try {
    const contentRes = await documentApi.getContent(numId);
    if (contentRes.data?.success && contentRes.data?.data?.pages) {
      extractedPages = contentRes.data.data.pages;
      totalPages = contentRes.data.data.totalPages || extractedPages.length;
    }
  } catch {
    // Extraction may still be processing or failed; PDF stream remains available
  }

  // Fetch the PDF stream using the authenticated documentApi client
  // so the Authorization: Bearer <token> header is attached via the axios interceptor.
  // Pass the binary ArrayBuffer directly to avoid blob URL fetch and revocation issues.
  let pdfSource: string | ArrayBuffer = `/api/documents/${doc.id}/stream`;
  try {
    const streamRes = await documentApi.getStream(numId);
    if (streamRes.data) {
      if (typeof streamRes.data.arrayBuffer === "function") {
        pdfSource = await streamRes.data.arrayBuffer();
      } else if (streamRes.data instanceof ArrayBuffer) {
        pdfSource = streamRes.data;
      } else if (typeof FileReader !== "undefined") {
        pdfSource = await new Promise<ArrayBuffer>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as ArrayBuffer);
          reader.onerror = reject;
          reader.readAsArrayBuffer(streamRes.data);
        });
      }
    }
  } catch {
    // If stream fetch fails, fall back to relative stream endpoint
  }

  return {
    documentId: String(doc.id),
    title: doc.title,
    fileName: doc.fileName,
    pdfSource,
    extractedPages,
    totalPages,
  };
}
