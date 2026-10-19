/**
 * documents.$id.read.tsx
 *
 * Protected Reader route — /documents/:id/read
 *
 * Auth: redirects to / if no token (matches existing project convention).
 * Loads the DocumentReaderSource for the given :id, then renders PDFReader.
 */

import { useState, useEffect } from "react";
import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import PDFReader from "@/components/PDFReader";
import {
  resolveDocumentSource,
  type DocumentReaderSource,
} from "@/lib/documentSource";

// ---------------------------------------------------------------------------
// Route definition — protected, matches existing dashboard pattern
// ---------------------------------------------------------------------------

export const Route = createFileRoute("/documents/$id/read")({
  beforeLoad: () => {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("readable_token")
        : null;
    if (!token) {
      throw redirect({ to: "/" });
    }
  },
  head: () => ({
    meta: [
      { title: "Reader — ReadAble" },
      {
        name: "description",
        content: "Accessible PDF reader with progress tracking and resume.",
      },
    ],
  }),
  component: ReaderPage,
});

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

type State =
  | { status: "loading" }
  | { status: "ready"; source: DocumentReaderSource }
  | { status: "notFound" }
  | { status: "error"; message: string };

function ReaderPage() {
  const { id } = Route.useParams();
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const source = await resolveDocumentSource(id);
        if (cancelled) return;
        if (!source) {
          setState({ status: "notFound" });
        } else {
          setState({ status: "ready", source });
        }
      } catch (err) {
        if (cancelled) return;
        setState({
          status: "error",
          message: err instanceof Error ? err.message : "Unknown error",
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (state.status === "loading") {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Inter, sans-serif",
          color: "#888",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: 36,
              height: 36,
              border: "3px solid #ddd",
              borderTop: "3px solid #6c63ff",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
              margin: "0 auto 14px",
            }}
          />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          Loading reader…
        </div>
      </div>
    );
  }

  if (state.status === "notFound") {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          fontFamily: "Inter, sans-serif",
          color: "#555",
        }}
      >
        <div style={{ fontSize: "2rem" }}>📄</div>
        <div style={{ fontWeight: 600 }}>Document not found</div>
        <div style={{ fontSize: "0.875rem", color: "#888" }}>
          The document <code>"{id}"</code> does not exist.
        </div>
        <Link
          to="/dashboard"
          style={{ color: "#6c63ff", fontSize: "0.875rem", marginTop: 4 }}
        >
          Back to Dashboard
        </Link>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          fontFamily: "Inter, sans-serif",
          color: "#555",
        }}
      >
        <div style={{ fontWeight: 600, color: "#d64545" }}>
          Failed to load document
        </div>
        <div style={{ fontSize: "0.875rem", color: "#888" }}>
          {state.message}
        </div>
        <Link
          to="/dashboard"
          style={{ color: "#6c63ff", fontSize: "0.875rem", marginTop: 4 }}
        >
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return <PDFReader source={state.source} />;
}
