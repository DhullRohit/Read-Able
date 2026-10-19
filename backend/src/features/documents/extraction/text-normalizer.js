/**
 * text-normalizer.js
 *
 * Conservative text normalization for extracted PDF text.
 *
 * Goals:
 * 1. Clean excessive horizontal whitespace, carriage returns, and extraction artifacts.
 * 2. Reduce multiple empty lines to consistent paragraph boundaries (max 1 blank line).
 * 3. PRESERVE paragraphs, headings, bullet/numbered lists, and code blocks.
 * 4. Do NOT aggressively rewrite or destroy structured content (e.g. `for(int i = 0; i < n; i++)`).
 */

/**
 * Normalizes a single page of extracted text.
 *
 * @param {string} rawText
 * @returns {string}
 */
export function normalizeText(rawText) {
  if (!rawText || typeof rawText !== "string") {
    return "";
  }

  // 1. Unify line endings to \n
  let text = rawText.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  // 2. Normalize non-breaking spaces and other special Unicode space characters to ASCII space
  text = text.replace(/[\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000]/g, " ");

  // 3. Remove non-printable control characters except \n and \t
  text = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");

  // 4. Process line by line:
  // - Trim trailing whitespace on each line
  // - Preserve leading indentation (for lists, code, etc.)
  // - Collapse multiple consecutive internal spaces/tabs to a single space
  const lines = text.split("\n");
  const cleanedLines = lines.map((line) => {
    // Extract leading whitespace
    const leadingMatch = line.match(/^([ \t]*)/);
    const leadingIndent = leadingMatch ? leadingMatch[1] : "";
    const content = line.slice(leadingIndent.length);

    // Collapse multiple internal spaces in content
    const normalizedContent = content.replace(/[ \t]{2,}/g, " ");

    return (leadingIndent + normalizedContent).trimEnd();
  });

  // 5. Join back and collapse 3 or more consecutive newlines down to 2 (1 empty separating line)
  text = cleanedLines.join("\n").replace(/\n{3,}/g, "\n\n");

  // 6. Trim leading and trailing whitespace of the overall page
  return text.trim();
}

/**
 * Breaks normalized page text into distinct paragraphs.
 * Paragraphs are separated by one or more blank lines (\n\n).
 *
 * @param {string} normalizedText
 * @returns {string[]}
 */
export function extractParagraphs(normalizedText) {
  if (!normalizedText || typeof normalizedText !== "string") {
    return [];
  }

  return normalizedText
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
}
