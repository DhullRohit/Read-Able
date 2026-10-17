/**
 * readerSettings.ts
 *
 * Persists and retrieves Reader UI preferences from localStorage.
 * Extensible for accessible reading: font size, typography, spacing, contrast theme,
 * and view mode (Extracted Text vs Original PDF).
 */

const SETTINGS_KEY = "readable_reader_settings";

export type ReaderTheme = "light" | "dark" | "sepia";
export type ReaderFont = "OpenDyslexic" | "Lexend" | "Inter" | "System";
export type ReaderViewMode = "text" | "pdf";

export interface ReaderSettings {
  theme: ReaderTheme;
  zoom: number; // PDF zoom percentage, e.g. 100 = 100%
  viewMode: ReaderViewMode; // 'text' for accessible structured text, 'pdf' for canvas PDF
  fontSize: number; // Text font size in px (14 - 32)
  fontFamily: ReaderFont;
  comfortableSpacing: boolean; // Increased line-height & letter-spacing
}

const DEFAULTS: ReaderSettings = {
  theme: "light",
  zoom: 100,
  viewMode: "text",
  fontSize: 18,
  fontFamily: "OpenDyslexic",
  comfortableSpacing: true,
};

export function loadReaderSettings(): ReaderSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw) as Partial<ReaderSettings>;
    return {
      theme:
        parsed.theme === "dark" || parsed.theme === "sepia"
          ? parsed.theme
          : "light",
      zoom: typeof parsed.zoom === "number" ? parsed.zoom : DEFAULTS.zoom,
      viewMode: parsed.viewMode === "pdf" ? "pdf" : "text",
      fontSize: typeof parsed.fontSize === "number" ? parsed.fontSize : DEFAULTS.fontSize,
      fontFamily: parsed.fontFamily || DEFAULTS.fontFamily,
      comfortableSpacing:
        typeof parsed.comfortableSpacing === "boolean"
          ? parsed.comfortableSpacing
          : DEFAULTS.comfortableSpacing,
    };
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveReaderSettings(settings: ReaderSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // Fail silently if localStorage is restricted
  }
}
