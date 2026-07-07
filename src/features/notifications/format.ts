const relativeTimeFormatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/** "3m ago" / "2h ago" / "Yesterday" style relative time, falling back to a plain date past a week. */
export function formatRelativeTime(date: Date): string {
  const diffMs = date.getTime() - Date.now();
  const diffMinutes = Math.round(diffMs / 60_000);

  if (Math.abs(diffMs) >= WEEK_MS) {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
  if (Math.abs(diffMinutes) < 1) return "Just now";
  if (Math.abs(diffMinutes) < 60) return relativeTimeFormatter.format(diffMinutes, "minute");

  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) return relativeTimeFormatter.format(diffHours, "hour");

  const diffDays = Math.round(diffHours / 24);
  return relativeTimeFormatter.format(diffDays, "day");
}
