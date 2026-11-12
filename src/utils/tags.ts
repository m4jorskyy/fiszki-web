/**
 * Parse comma- or semicolon-separated tag text into a normalized, non-empty array.
 */
export function parseTagsInput(raw: string): string[] {
  return raw
    .split(/[;,]/)
    .map((s) => s.trim())
    .filter(Boolean);
}
