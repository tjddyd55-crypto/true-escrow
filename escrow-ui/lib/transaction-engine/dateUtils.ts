/**
 * Date utilities for timeline (YYYY-MM-DD only, no timezone shift)
 */

export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function addDays(iso: string, n: number): string {
  const d = new Date(iso + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return toISODate(d);
}

/** Number of days from start to end (inclusive of both). end >= start. */
export function daysBetween(startIso: string, endIso: string): number {
  const start = new Date(startIso + "T12:00:00Z").getTime();
  const end = new Date(endIso + "T12:00:00Z").getTime();
  if (end < start) return 0;
  return Math.round((end - start) / (24 * 60 * 60 * 1000)) + 1;
}

/** Day index from transaction start (1-based). Same day = 1. */
export function dayOffset(transactionStartIso: string, dateIso: string): number {
  return daysBetween(transactionStartIso, dateIso);
}

/** Format for display: "Feb 2" or "2026-02-02" */
export function formatShortDate(iso: string): string {
  const d = new Date(iso + "T12:00:00Z");
  const months = "Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split(" ");
  return `${months[d.getUTCMonth()]} ${d.getUTCDate()}`;
}

export function formatShortRange(startIso: string, endIso: string): string {
  return `${formatShortDate(startIso)} – ${formatShortDate(endIso)}`;
}

/** Compare two YYYY-MM-DD strings. Returns -1, 0, or 1. */
export function compareDate(a: string, b: string): number {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}
