/**
 * Timeline segments: real blocks + auto-generated gap blocks (neutral empty time).
 * Gap = no label, no meaning, no rules. No uncolored dates within transaction range.
 */

import type { Block, TimelineSegment, CalendarDay } from "./types";
import { addDays, compareDate, daysBetween } from "./dateUtils";

/**
 * Build ordered list of segments (blocks and gaps) covering [txStartDate, txEndDate].
 * - Gap before first block if txStart < firstBlock.startDate
 * - Gap between consecutive blocks when block[i].endDate + 1 < block[i+1].startDate
 * - Gap after last block if lastBlock.endDate < txEnd
 */
export function getTimelineSegments(
  txStartDate: string,
  txEndDate: string,
  blocks: Block[]
): TimelineSegment[] {
  const sorted = [...blocks].sort(
    (a, b) => compareDate(a.startDate, b.startDate) || a.orderIndex - b.orderIndex
  );
  const out: TimelineSegment[] = [];

  if (sorted.length === 0) {
    // Whole range is one gap
    out.push({ type: "gap", startDate: txStartDate, endDate: txEndDate });
    return out;
  }

  const first = sorted[0];
  const last = sorted[sorted.length - 1];

  if (compareDate(txStartDate, first.startDate) < 0) {
    const gapEnd = addDays(first.startDate, -1);
    if (compareDate(txStartDate, gapEnd) <= 0) {
      out.push({ type: "gap", startDate: txStartDate, endDate: gapEnd });
    }
  }

  for (let i = 0; i < sorted.length; i++) {
    out.push({ type: "block", block: sorted[i] });
    if (i < sorted.length - 1) {
      const next = sorted[i + 1];
      const gapStart = addDays(sorted[i].endDate, 1);
      const gapEnd = addDays(next.startDate, -1);
      if (compareDate(gapStart, gapEnd) <= 0) {
        out.push({ type: "gap", startDate: gapStart, endDate: gapEnd });
      }
    }
  }

  if (compareDate(last.endDate, txEndDate) < 0) {
    const gapStart = addDays(last.endDate, 1);
    if (compareDate(gapStart, txEndDate) <= 0) {
      out.push({ type: "gap", startDate: gapStart, endDate: txEndDate });
    }
  }

  return out;
}

/**
 * Get the segment (block or gap) that contains the given date, if any.
 * Used by calendar to color a day.
 */
export function getSegmentAtDate(
  segments: TimelineSegment[],
  dateIso: string
): TimelineSegment | undefined {
  for (const seg of segments) {
    if (seg.type === "block") {
      if (compareDate(dateIso, seg.block.startDate) >= 0 && compareDate(dateIso, seg.block.endDate) <= 0) {
        return seg;
      }
    } else {
      if (compareDate(dateIso, seg.startDate) >= 0 && compareDate(dateIso, seg.endDate) <= 0) {
        return seg;
      }
    }
  }
  return undefined;
}

/**
 * Step 1: allDays = transaction.startDate → endDate
 * Step 2: Block overlay → mark days in block range as BLOCK
 * Step 3: Days in transaction range not in any block = IDLE
 */
export function getCalendarDays(
  txStartDate: string,
  txEndDate: string,
  segments: TimelineSegment[],
  blockColorMap: Map<string, string>,
  blockIndexById?: Map<string, number>
): CalendarDay[] {
  const days: CalendarDay[] = [];
  const n = daysBetween(txStartDate, txEndDate);
  for (let i = 0; i < n; i++) {
    const date = addDays(txStartDate, i);
    const seg = getSegmentAtDate(segments, date);
    if (seg?.type === "block") {
      days.push({
        date,
        inTransaction: true,
        type: "BLOCK",
        blockId: seg.block.id,
        blockTitle: seg.block.title,
        blockIndex: blockIndexById?.get(seg.block.id),
        color: blockColorMap.get(seg.block.id),
      });
    } else {
      days.push({ date, inTransaction: true, type: "IDLE" });
    }
  }
  return days;
}
