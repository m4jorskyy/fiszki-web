/**
 * Format milliseconds remaining until next scheduled review into compact display string.
 */
export function formatCountdown(msRemaining: number): string {
  if (msRemaining <= 0) return "00:00";
  const totalSec = Math.ceil(msRemaining / 1000);
  const hours = Math.floor(totalSec / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;
  if (hours > 24) {
    const days = Math.round(hours / 24);
    return `${days}d`;
  }
  if (hours > 0) {
    return `${hours}h ${String(mins).padStart(2, "0")}m`;
  }
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

/**
 * Sanitize deck name into a filesystem-safe download filename stem.
 */
export function sanitizeFilename(name: string, fallback = "deck"): string {
  return (
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9-_ ]/g, "")
      .replace(/\s+/g, "-") || fallback
  );
}
