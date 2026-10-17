/**
 * PDFReader.tsx
 *
 * Core Document Reading Experience — Phase 3
 *
 * Implements an accessible, high-performance reader supporting:
 *  - Dual View Modes:
 *      1. Accessible Text Mode: Structured, page-by-page paragraph text extracted
 *         by Phase 2 with dyslexia-friendly fonts, font sizing, and line spacing.
 *      2. Original PDF Mode: High-fidelity PDF rendering via react-pdf.
 *  - Page Navigation: Previous / Next, page jump input, keyboard shortcuts (← →).
 *  - Reading Progress & Resume: Auto-restores last reading position without page-1 flash.
 *    Debounced auto-save on page turn and instant save on tab hide.
 *  - Reading Preferences: Light, Dark, and Sepia contrast themes; OpenDyslexic / Lexend / Inter fonts;
 *    comfortable line/letter spacing; zoom controls.
 *  - Loading, error, and empty-page states.
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/TextLayer.css";
import "react-pdf/dist/Page/AnnotationLayer.css";

import type { DocumentReaderSource } from "@/lib/documentSource";
import {
  loadReaderSettings,
  saveReaderSettings,
  type ReaderSettings,
  type ReaderTheme,
  type ReaderFont,
  type ReaderViewMode,
} from "@/lib/readerSettings";
import {
  getProgress,
  saveProgress,
  type ReadingProgress,
} from "@/lib/readerProgress";

// Setup pdf.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFReaderProps {
  source: DocumentReaderSource;
}

const ZOOM_STEPS = [50, 75, 100, 125, 150, 175, 200];
const DEFAULT_ZOOM_IDX = 2; // 100%

export default function PDFReader({ source }: PDFReaderProps) {
  const navigate = useNavigate();

  // Reader Preferences
  const [settings, setSettings] = useState<ReaderSettings>(() => loadReaderSettings());
  const [prefsOpen, setPrefsOpen] = useState(false);

  // Document & Page state
  const extractedPages = source.extractedPages || [];
  const hasExtractedText = extractedPages.length > 0;

  // If no extracted text is available, fall back to PDF view mode
  const activeViewMode: ReaderViewMode =
    settings.viewMode === "text" && !hasExtractedText ? "pdf" : settings.viewMode;

  const [numPdfPages, setNumPdfPages] = useState<number>(0);
  const totalPages = Math.max(
    1,
    activeViewMode === "pdf"
      ? (numPdfPages || source.totalPages || (hasExtractedText ? extractedPages.length : 1))
      : (hasExtractedText ? extractedPages.length : (numPdfPages || source.totalPages || 1))
  );

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageInput, setPageInput] = useState<string>("1");
  const [progressRestored, setProgressRestored] = useState(false);

  // PDF loading state
  const [pdfLoading, setPdfLoading] = useState(true);
  const [pdfError, setPdfError] = useState<string | null>(null);

  const saveDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ---------------------------------------------------------------------------
  // 1. Restore previous reading position on mount (Resume)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const saved = await getProgress(source.documentId);
      if (!cancelled && saved && saved.currentPage > 1) {
        setCurrentPage(saved.currentPage);
        setPageInput(String(saved.currentPage));
      }
      if (!cancelled) {
        setProgressRestored(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [source.documentId]);

  // ---------------------------------------------------------------------------
  // 2. Save reading progress (debounced on page change + immediate on tab hide)
  // ---------------------------------------------------------------------------
  const doSaveProgress = useCallback(
    (page: number, total: number) => {
      if (total <= 0) return;
      const progress: ReadingProgress = {
        documentId: source.documentId,
        currentPage: page,
        totalPages: total,
        percentage: Math.min(100, Math.max(0, Math.round((page / total) * 100))),
        lastReadAt: new Date().toISOString(),
      };
      saveProgress(progress);
    },
    [source.documentId]
  );

  useEffect(() => {
    if (!progressRestored || totalPages <= 0) return;

    if (saveDebounceRef.current) clearTimeout(saveDebounceRef.current);
    saveDebounceRef.current = setTimeout(() => {
      doSaveProgress(currentPage, totalPages);
    }, 500);

    return () => {
      if (saveDebounceRef.current) clearTimeout(saveDebounceRef.current);
    };
  }, [currentPage, totalPages, progressRestored, doSaveProgress]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden" && totalPages > 0) {
        doSaveProgress(currentPage, totalPages);
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [currentPage, totalPages, doSaveProgress]);

  // ---------------------------------------------------------------------------
  // 3. Navigation Controls
  // ---------------------------------------------------------------------------
  const goTo = useCallback(
    (page: number) => {
      const target = Math.max(1, Math.min(page, totalPages));
      setCurrentPage(target);
      setPageInput(String(target));
    },
    [totalPages]
  );

  const nextPage = useCallback(() => {
    setCurrentPage((prev) => {
      const next = Math.max(1, Math.min(prev + 1, totalPages));
      setPageInput(String(next));
      return next;
    });
  }, [totalPages]);

  const prevPage = useCallback(() => {
    setCurrentPage((prev) => {
      const prevVal = Math.max(1, Math.min(prev - 1, totalPages));
      setPageInput(String(prevVal));
      return prevVal;
    });
  }, [totalPages]);

  const handlePageInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(pageInput, 10);
    if (!isNaN(val)) {
      goTo(val);
    } else {
      setPageInput(String(currentPage));
    }
  };

  // Keyboard navigation (ArrowLeft / ArrowRight)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      if (e.key === "ArrowRight" || e.key === "PageDown") {
        e.preventDefault();
        nextPage();
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        prevPage();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [nextPage, prevPage]);

  // ---------------------------------------------------------------------------
  // 4. Preferences management
  // ---------------------------------------------------------------------------
  const updateSettings = (patch: Partial<ReaderSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      saveReaderSettings(next);
      return next;
    });
  };

  const handleThemeChange = (theme: ReaderTheme) => updateSettings({ theme });
  const handleFontChange = (fontFamily: ReaderFont) => updateSettings({ fontFamily });
  const handleViewModeToggle = () =>
    updateSettings({ viewMode: activeViewMode === "text" ? "pdf" : "text" });

  const changeFontSize = (delta: number) => {
    updateSettings({ fontSize: Math.max(14, Math.min(32, settings.fontSize + delta)) });
  };

  const changeZoom = (delta: number) => {
    const currentIdx = ZOOM_STEPS.indexOf(settings.zoom);
    const nextIdx = Math.max(0, Math.min(ZOOM_STEPS.length - 1, (currentIdx === -1 ? DEFAULT_ZOOM_IDX : currentIdx) + delta));
    updateSettings({ zoom: ZOOM_STEPS[nextIdx] });
  };

  // ---------------------------------------------------------------------------
  // 5. Visual Styling Theme Tokens
  // ---------------------------------------------------------------------------
  const themeColors = {
    light: {
      bg: "#FAF8F5",
      toolbar: "#FFFFFF",
      border: "#E7E2DA",
      text: "#1D2321",
      textMuted: "#66706D",
      card: "#FFFFFF",
      cardBorder: "#E8E3DA",
      accent: "#2B8272",
      accentHover: "#236B5D",
      accentTint: "rgba(43,130,114,0.08)",
      btnBg: "#F0EDE6",
    },
    sepia: {
      bg: "#FBF3DD",
      toolbar: "#F6ECCE",
      border: "#E8DCBA",
      text: "#332B1E",
      textMuted: "#7A6F5A",
      card: "#FBF3DD",
      cardBorder: "#EADCB6",
      accent: "#8A5A2B",
      accentHover: "#704820",
      accentTint: "rgba(138,90,43,0.1)",
      btnBg: "#EFE2BE",
    },
    dark: {
      bg: "#0E1815",
      toolbar: "#152420",
      border: "#233530",
      text: "#EAF7F1",
      textMuted: "#8DA39C",
      card: "#152420",
      cardBorder: "#273D37",
      accent: "#3DD9AE",
      accentHover: "#32B894",
      accentTint: "rgba(61,217,174,0.12)",
      btnBg: "#1F352F",
    },
  }[settings.theme];

  const fontFamilies: Record<ReaderFont, string> = {
    OpenDyslexic: "'OpenDyslexic', 'Comic Sans MS', 'Lexend', sans-serif",
    Lexend: "'Lexend', -apple-system, sans-serif",
    Inter: "'Inter', system-ui, sans-serif",
    System: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  };

  const progressPercentage =
    totalPages > 0 ? Math.min(100, Math.max(0, Math.round((currentPage / totalPages) * 100))) : 0;

  // Current page text from Phase 2 extracted pages
  const currentPageContent =
    hasExtractedText && currentPage <= extractedPages.length
      ? extractedPages[currentPage - 1]
      : null;

  // ---------------------------------------------------------------------------
  // 6. Loading screen before position is restored (prevents page 1 flash)
  // ---------------------------------------------------------------------------
  if (!progressRestored) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: themeColors.bg,
          color: themeColors.text,
          fontFamily: fontFamilies[settings.fontFamily],
          gap: 16,
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            border: `3px solid ${themeColors.border}`,
            borderTopColor: themeColors.accent,
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <p style={{ fontSize: "0.9375rem", color: themeColors.textMuted }}>
          Resuming reading position…
        </p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: themeColors.bg,
        color: themeColors.text,
        display: "flex",
        flexDirection: "column",
        fontFamily: fontFamilies[settings.fontFamily],
        transition: "background 0.2s, color 0.2s",
      }}
    >
      {/* -------------------------------------------------------------------- */}
      {/* Header Toolbar                                                       */}
      {/* -------------------------------------------------------------------- */}
      <header
        style={{
          height: 60,
          background: themeColors.toolbar,
          borderBottom: `1px solid ${themeColors.border}`,
          padding: "0 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          position: "sticky",
          top: 0,
          zIndex: 30,
        }}
      >
        {/* Left: Back & Title */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          <button
            type="button"
            onClick={() => navigate({ to: "/dashboard" })}
            title="Back to Dashboard"
            style={{
              background: themeColors.btnBg,
              border: `1px solid ${themeColors.border}`,
              color: themeColors.text,
              borderRadius: 8,
              padding: "6px 10px",
              fontSize: "0.8125rem",
              fontWeight: 500,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            ← <span className="hidden sm:inline">Dashboard</span>
          </button>

          <div style={{ minWidth: 0 }}>
            <h1
              style={{
                fontSize: "0.9375rem",
                fontWeight: 600,
                margin: 0,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                maxWidth: "260px",
              }}
              title={source.title}
            >
              {source.title}
            </h1>
          </div>
        </div>

        {/* Center: Page Navigation Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <button
            type="button"
            onClick={prevPage}
            disabled={currentPage <= 1}
            title="Previous page (Left Arrow)"
            style={{
              background: themeColors.btnBg,
              border: `1px solid ${themeColors.border}`,
              color: currentPage <= 1 ? themeColors.textMuted : themeColors.text,
              opacity: currentPage <= 1 ? 0.4 : 1,
              borderRadius: 8,
              padding: "6px 10px",
              fontSize: "0.875rem",
              cursor: currentPage <= 1 ? "not-allowed" : "pointer",
              fontWeight: 600,
            }}
          >
            ←
          </button>

          <form
            onSubmit={handlePageInputSubmit}
            style={{ display: "flex", alignItems: "center", gap: 4 }}
          >
            <input
              type="text"
              inputMode="numeric"
              value={pageInput}
              onChange={(e) => setPageInput(e.target.value)}
              onBlur={handlePageInputSubmit}
              aria-label="Current Page Number"
              style={{
                width: 44,
                textAlign: "center",
                background: themeColors.bg,
                color: themeColors.text,
                border: `1px solid ${themeColors.border}`,
                borderRadius: 6,
                padding: "4px 0",
                fontSize: "0.875rem",
                fontWeight: 600,
                outline: "none",
              }}
            />
            <span style={{ fontSize: "0.8125rem", color: themeColors.textMuted }}>
              / {totalPages}
            </span>
          </form>

          <button
            type="button"
            onClick={nextPage}
            disabled={currentPage >= totalPages}
            title="Next page (Right Arrow)"
            style={{
              background: themeColors.btnBg,
              border: `1px solid ${themeColors.border}`,
              color: currentPage >= totalPages ? themeColors.textMuted : themeColors.text,
              opacity: currentPage >= totalPages ? 0.4 : 1,
              borderRadius: 8,
              padding: "6px 10px",
              fontSize: "0.875rem",
              cursor: currentPage >= totalPages ? "not-allowed" : "pointer",
              fontWeight: 600,
            }}
          >
            →
          </button>
        </div>

        {/* Right: View Mode Toggle & Preferences */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, position: "relative" }}>
          {/* View Mode Toggle: Accessible Text vs Original PDF */}
          {hasExtractedText && (
            <button
              type="button"
              onClick={handleViewModeToggle}
              title={`Switch to ${activeViewMode === "text" ? "Original PDF" : "Accessible Text"} view`}
              style={{
                background: themeColors.btnBg,
                border: `1px solid ${themeColors.border}`,
                color: themeColors.text,
                borderRadius: 8,
                padding: "6px 10px",
                fontSize: "0.75rem",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              {activeViewMode === "text" ? "📄 View PDF" : "✨ Text Mode"}
            </button>
          )}

          {/* Reading Preferences Toggle Button */}
          <button
            type="button"
            onClick={() => setPrefsOpen((v) => !v)}
            title="Reading Preferences"
            style={{
              background: prefsOpen ? themeColors.accentTint : themeColors.btnBg,
              border: `1px solid ${prefsOpen ? themeColors.accent : themeColors.border}`,
              color: prefsOpen ? themeColors.accent : themeColors.text,
              borderRadius: 8,
              padding: "6px 10px",
              fontSize: "0.8125rem",
              fontWeight: 500,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            ⚙️ <span className="hidden sm:inline">Preferences</span>
          </button>

          {/* Preferences Dropdown Panel */}
          {prefsOpen && (
            <div
              style={{
                position: "absolute",
                top: 48,
                right: 0,
                width: 280,
                background: themeColors.toolbar,
                border: `1px solid ${themeColors.border}`,
                borderRadius: 12,
                boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
                padding: 16,
                zIndex: 40,
                display: "flex",
                flexDirection: "column",
                gap: 14,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderBottom: `1px solid ${themeColors.border}`,
                  paddingBottom: 8,
                }}
              >
                <span style={{ fontWeight: 600, fontSize: "0.875rem" }}>
                  Reading Preferences
                </span>
                <button
                  type="button"
                  onClick={() => setPrefsOpen(false)}
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: "0.9375rem",
                    color: themeColors.textMuted,
                    cursor: "pointer",
                  }}
                >
                  ✕
                </button>
              </div>

              {/* Theme Choice */}
              <div>
                <label style={{ fontSize: "0.75rem", color: themeColors.textMuted, display: "block", marginBottom: 6 }}>
                  CONTRAST THEME
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
                  {(["light", "sepia", "dark"] as ReaderTheme[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => handleThemeChange(t)}
                      style={{
                        padding: "6px 0",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        borderRadius: 6,
                        border: `1px solid ${settings.theme === t ? themeColors.accent : themeColors.border}`,
                        background: settings.theme === t ? themeColors.accentTint : themeColors.btnBg,
                        color: settings.theme === t ? themeColors.accent : themeColors.text,
                        cursor: "pointer",
                        textTransform: "capitalize",
                      }}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Font Sizing (for Text Mode) */}
              <div>
                <label style={{ fontSize: "0.75rem", color: themeColors.textMuted, display: "block", marginBottom: 6 }}>
                  TEXT SIZE: {settings.fontSize}px
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => changeFontSize(-2)}
                    disabled={settings.fontSize <= 14}
                    style={{
                      flex: 1,
                      padding: "5px 0",
                      background: themeColors.btnBg,
                      border: `1px solid ${themeColors.border}`,
                      color: themeColors.text,
                      borderRadius: 6,
                      fontSize: "0.8125rem",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    A-
                  </button>
                  <button
                    type="button"
                    onClick={() => changeFontSize(2)}
                    disabled={settings.fontSize >= 32}
                    style={{
                      flex: 1,
                      padding: "5px 0",
                      background: themeColors.btnBg,
                      border: `1px solid ${themeColors.border}`,
                      color: themeColors.text,
                      borderRadius: 6,
                      fontSize: "0.8125rem",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    A+
                  </button>
                </div>
              </div>

              {/* Typography */}
              <div>
                <label style={{ fontSize: "0.75rem", color: themeColors.textMuted, display: "block", marginBottom: 6 }}>
                  FONT FAMILY
                </label>
                <select
                  value={settings.fontFamily}
                  onChange={(e) => handleFontChange(e.target.value as ReaderFont)}
                  style={{
                    width: "100%",
                    background: themeColors.bg,
                    color: themeColors.text,
                    border: `1px solid ${themeColors.border}`,
                    borderRadius: 6,
                    padding: "6px 8px",
                    fontSize: "0.8125rem",
                    outline: "none",
                  }}
                >
                  <option value="OpenDyslexic">OpenDyslexic (Dyslexia)</option>
                  <option value="Lexend">Lexend (Reading Fluency)</option>
                  <option value="Inter">Inter (Sans-serif)</option>
                  <option value="System">System Default</option>
                </select>
              </div>

              {/* Comfortable Spacing */}
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  fontSize: "0.8125rem",
                  cursor: "pointer",
                }}
              >
                <span>Comfortable line spacing</span>
                <input
                  type="checkbox"
                  checked={settings.comfortableSpacing}
                  onChange={(e) => updateSettings({ comfortableSpacing: e.target.checked })}
                  style={{ accentColor: themeColors.accent }}
                />
              </label>

              {/* PDF Zoom Controls (if viewing PDF) */}
              {activeViewMode === "pdf" && (
                <div>
                  <label style={{ fontSize: "0.75rem", color: themeColors.textMuted, display: "block", marginBottom: 6 }}>
                    PDF ZOOM: {settings.zoom}%
                  </label>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      type="button"
                      onClick={() => changeZoom(-1)}
                      style={{
                        flex: 1,
                        padding: "5px 0",
                        background: themeColors.btnBg,
                        border: `1px solid ${themeColors.border}`,
                        color: themeColors.text,
                        borderRadius: 6,
                        cursor: "pointer",
                      }}
                    >
                      -
                    </button>
                    <button
                      type="button"
                      onClick={() => updateSettings({ zoom: 100 })}
                      style={{
                        flex: 1,
                        padding: "5px 0",
                        background: themeColors.btnBg,
                        border: `1px solid ${themeColors.border}`,
                        color: themeColors.text,
                        borderRadius: 6,
                        cursor: "pointer",
                        fontSize: "0.75rem",
                      }}
                    >
                      Reset
                    </button>
                    <button
                      type="button"
                      onClick={() => changeZoom(1)}
                      style={{
                        flex: 1,
                        padding: "5px 0",
                        background: themeColors.btnBg,
                        border: `1px solid ${themeColors.border}`,
                        color: themeColors.text,
                        borderRadius: 6,
                        cursor: "pointer",
                      }}
                    >
                      +
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* -------------------------------------------------------------------- */}
      {/* Main Reading Canvas                                                  */}
      {/* -------------------------------------------------------------------- */}
      <main
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "24px 16px 80px",
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-start",
        }}
      >
        {/* VIEW MODE 1: Accessible Structured Text View (Phase 2 output) */}
        {activeViewMode === "text" && (
          <article
            style={{
              width: "100%",
              maxWidth: "760px",
              background: themeColors.card,
              border: `1px solid ${themeColors.cardBorder}`,
              borderRadius: "14px",
              padding: "40px 36px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
              fontSize: `${settings.fontSize}px`,
              lineHeight: settings.comfortableSpacing ? 1.85 : 1.5,
              letterSpacing: settings.comfortableSpacing ? "0.02em" : "normal",
            }}
          >
            {/* Page Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderBottom: `1px solid ${themeColors.border}`,
                paddingBottom: "12px",
                marginBottom: "24px",
                fontSize: "0.8125rem",
                color: themeColors.textMuted,
              }}
            >
              <span>Page {currentPage} of {totalPages}</span>
              <span>{source.title}</span>
            </div>

            {/* Content Display */}
            {currentPageContent && currentPageContent.text ? (
              <div style={{ display: "flex", flexDirection: "column", gap: settings.comfortableSpacing ? "20px" : "14px" }}>
                {currentPageContent.paragraphs && currentPageContent.paragraphs.length > 0 ? (
                  currentPageContent.paragraphs.map((p, idx) => (
                    <p
                      key={idx}
                      style={{
                        margin: 0,
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                      }}
                    >
                      {p}
                    </p>
                  ))
                ) : (
                  <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>
                    {currentPageContent.text}
                  </p>
                )}
              </div>
            ) : (
              /* Empty page state */
              <div
                style={{
                  padding: "48px 16px",
                  textAlign: "center",
                  color: themeColors.textMuted,
                }}
              >
                <div style={{ fontSize: "2rem", marginBottom: 12 }}>🖼️</div>
                <h3 style={{ fontSize: "1rem", fontWeight: 600, color: themeColors.text, margin: "0 0 6px" }}>
                  No extractable text on page {currentPage}
                </h3>
                <p style={{ fontSize: "0.875rem", margin: "0 0 16px" }}>
                  This page may be an image, scan, or blank page.
                </p>
                <button
                  type="button"
                  onClick={handleViewModeToggle}
                  style={{
                    background: themeColors.accent,
                    color: "#fff",
                    border: "none",
                    padding: "8px 16px",
                    borderRadius: 8,
                    fontSize: "0.8125rem",
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                >
                  Switch to Original PDF View
                </button>
              </div>
            )}
          </article>
        )}

        {/* VIEW MODE 2: Original PDF Canvas View (Phase 1 PDF Stream) */}
        {activeViewMode === "pdf" && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              width: "100%",
            }}
          >
            {pdfError && (
              <div
                style={{
                  padding: "24px",
                  textAlign: "center",
                  color: "#d64545",
                  background: themeColors.card,
                  borderRadius: 10,
                  border: `1px solid ${themeColors.border}`,
                  maxWidth: 420,
                }}
              >
                <p style={{ fontWeight: 600, margin: "0 0 8px" }}>Could not load PDF view</p>
                <p style={{ fontSize: "0.8125rem", color: themeColors.textMuted, margin: 0 }}>
                  {pdfError}
                </p>
              </div>
            )}

            {pdfLoading && !pdfError && (
              <div style={{ padding: 40, textAlign: "center", color: themeColors.textMuted }}>
                Loading PDF…
              </div>
            )}

            <div
              style={{
                boxShadow: "0 6px 24px rgba(0,0,0,0.18)",
                borderRadius: 6,
                overflow: "hidden",
                maxWidth: "100%",
              }}
            >
              <Document
                file={source.pdfSource}
                onLoadSuccess={({ numPages }) => {
                  setNumPdfPages(numPages);
                  setPdfLoading(false);
                }}
                onLoadError={(err) => {
                  setPdfError(err.message);
                  setPdfLoading(false);
                }}
                loading={null}
              >
                <Page
                  key={`pdf_page_${currentPage}`}
                  pageNumber={currentPage}
                  scale={settings.zoom / 100}
                  renderTextLayer={true}
                  renderAnnotationLayer={true}
                />
              </Document>
            </div>
          </div>
        )}
      </main>

      {/* -------------------------------------------------------------------- */}
      {/* Bottom Progress Bar & Reader Status                                  */}
      {/* -------------------------------------------------------------------- */}
      <footer
        style={{
          height: 48,
          background: themeColors.toolbar,
          borderTop: `1px solid ${themeColors.border}`,
          padding: "0 20px",
          display: "flex",
          alignItems: "center",
          gap: 14,
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 25,
        }}
      >
        <span
          style={{
            fontSize: "0.75rem",
            fontWeight: 600,
            color: themeColors.textMuted,
            minWidth: 34,
          }}
        >
          {progressPercentage}%
        </span>

        {/* Progress Bar Track */}
        <div
          role="progressbar"
          aria-valuenow={progressPercentage}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Document Reading Progress"
          style={{
            flex: 1,
            height: 6,
            background: themeColors.border,
            borderRadius: 4,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${progressPercentage}%`,
              background: themeColors.accent,
              borderRadius: 4,
              transition: "width 0.3s ease",
            }}
          />
        </div>

        <span
          style={{
            fontSize: "0.75rem",
            color: themeColors.textMuted,
            whiteSpace: "nowrap",
          }}
        >
          Page {currentPage} of {totalPages}
        </span>
      </footer>
    </div>
  );
}
