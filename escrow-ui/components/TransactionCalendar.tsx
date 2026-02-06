"use client";

import { useState, useMemo } from "react";
import type { Block, TimelineSegment } from "@/lib/transaction-engine/types";
import { getSegmentAtDate, getTimelineSegments } from "@/lib/transaction-engine/timelineSegments";
import {
  addDays,
  compareDate,
  daysBetween,
  formatShortDate,
  formatShortRange,
  formatMonthYear,
  getMonthKey,
  monthStart,
  monthEnd,
} from "@/lib/transaction-engine/dateUtils";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Distinct colors per block so "which phase" is obvious at a glance */
const BLOCK_COLORS = [
  "#bbdefb", // blue
  "#c8e6c9", // green
  "#ffe0b2", // orange
  "#f8bbd9", // pink
  "#e1bee7", // purple
  "#b2ebf2", // cyan
];

type Props = {
  txStartDate: string;
  txEndDate: string;
  blocks: Block[];
  title?: string;
};

/**
 * Calendar: month header with prev/next, blocks as colored bars (distinct color per block),
 * gap = grey dashed. Read-only, tooltip = date range + duration. Covers entire transaction range.
 */
export function TransactionCalendar({ txStartDate, txEndDate, blocks, title }: Props) {
  const segments = useMemo(
    () => getTimelineSegments(txStartDate, txEndDate, blocks),
    [txStartDate, txEndDate, blocks]
  );

  const monthsInRange = useMemo(() => {
    const list: string[] = [];
    let cur = monthStart(txStartDate);
    while (compareDate(cur, txEndDate) <= 0) {
      list.push(getMonthKey(cur));
      cur = addDays(monthEnd(cur), 1);
    }
    return list;
  }, [txStartDate, txEndDate]);

  const [monthIndex, setMonthIndex] = useState(0);
  const currentMonthKey = monthsInRange[monthIndex] ?? getMonthKey(txStartDate);
  const monthStartIso = currentMonthKey + "-01";
  const monthEndIso = monthEnd(monthStartIso);

  const blockColorMap = useMemo(() => {
    const m = new Map<string, string>();
    segments.forEach((seg, idx) => {
      if (seg.type === "block") m.set(seg.block.id, BLOCK_COLORS[idx % BLOCK_COLORS.length]);
    });
    return m;
  }, [segments]);

  const totalDaysInMonth = daysBetween(monthStartIso, monthEndIso);
  const start = new Date(monthStartIso + "T12:00:00Z");
  const startWeekday = start.getUTCDay();

  const days: { date: string; seg: TimelineSegment | undefined }[] = [];
  for (let i = 0; i < totalDaysInMonth; i++) {
    const date = addDays(monthStartIso, i);
    const inRange = compareDate(date, txStartDate) >= 0 && compareDate(date, txEndDate) <= 0;
    const seg = inRange ? getSegmentAtDate(segments, date) : undefined;
    days.push({ date, seg });
  }

  const weekRows: { date: string; seg: TimelineSegment | undefined }[][] = [];
  let row: { date: string; seg: TimelineSegment | undefined }[] = [];
  for (let p = 0; p < startWeekday; p++) {
    row.push({ date: "", seg: undefined });
  }
  for (const d of days) {
    row.push(d);
    if (row.length === 7) {
      weekRows.push(row);
      row = [];
    }
  }
  if (row.length) {
    while (row.length < 7) row.push({ date: "", seg: undefined });
    weekRows.push(row);
  }

  const inTxRange = (date: string) =>
    compareDate(date, txStartDate) >= 0 && compareDate(date, txEndDate) <= 0;

  const tooltipFor = (cell: { date: string; seg: TimelineSegment | undefined }) => {
    if (!cell.date || !cell.seg) return formatShortDate(cell.date);
    if (cell.seg.type === "block") {
      const b = cell.seg.block;
      const dur = daysBetween(b.startDate, b.endDate);
      return `${b.title}\n${formatShortRange(b.startDate, b.endDate)} (${dur} days)`;
    }
    const dur = daysBetween(cell.seg.startDate, cell.seg.endDate);
    return `${formatShortRange(cell.seg.startDate, cell.seg.endDate)} (${dur} days)`;
  };

  /** Same segment (block or gap) on prev/next day → hide inner border for continuous bar */
  const sameSegmentPrev = (date: string, seg: TimelineSegment | undefined) => {
    if (!seg) return false;
    const prev = addDays(date, -1);
    const prevSeg = getSegmentAtDate(segments, prev);
    if (!prevSeg) return false;
    if (seg.type === "block" && prevSeg.type === "block") return seg.block.id === prevSeg.block.id;
    if (seg.type === "gap" && prevSeg.type === "gap") return compareDate(prev, seg.startDate) >= 0;
    return false;
  };
  const sameSegmentNext = (date: string, seg: TimelineSegment | undefined) => {
    if (!seg) return false;
    const next = addDays(date, 1);
    const nextSeg = getSegmentAtDate(segments, next);
    if (!nextSeg) return false;
    if (seg.type === "block" && nextSeg.type === "block") return seg.block.id === nextSeg.block.id;
    if (seg.type === "gap" && nextSeg.type === "gap") return compareDate(next, seg.endDate) <= 0;
    return false;
  };

  if (monthsInRange.length === 0) return null;

  return (
    <div style={{ marginBottom: 24 }}>
      {title && <h3 style={{ fontSize: "1.1rem", marginBottom: 10 }}>{title}</h3>}

      {/* Month header: "◀ 2026 February ▶" — clear which month, navigate entire tx range */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 12,
          padding: "10px 0",
          borderBottom: "1px solid #e0e0e0",
        }}
      >
        <button
          type="button"
          aria-label="Previous month"
          disabled={monthIndex <= 0}
          onClick={() => setMonthIndex((i) => Math.max(0, i - 1))}
          style={{
            padding: "8px 14px",
            border: "1px solid #e0e0e0",
            borderRadius: 6,
            background: monthIndex <= 0 ? "#f5f5f5" : "white",
            cursor: monthIndex <= 0 ? "not-allowed" : "pointer",
            fontSize: "1rem",
            fontWeight: "600",
          }}
        >
          ◀
        </button>
        <span style={{ fontWeight: "700", fontSize: "1.25rem", color: "#111" }}>
          {formatMonthYear(monthStartIso)}
        </span>
        <button
          type="button"
          aria-label="Next month"
          disabled={monthIndex >= monthsInRange.length - 1}
          onClick={() => setMonthIndex((i) => Math.min(monthsInRange.length - 1, i + 1))}
          style={{
            padding: "8px 14px",
            border: "1px solid #e0e0e0",
            borderRadius: 6,
            background: monthIndex >= monthsInRange.length - 1 ? "#f5f5f5" : "white",
            cursor: monthIndex >= monthsInRange.length - 1 ? "not-allowed" : "pointer",
            fontSize: "1rem",
            fontWeight: "600",
          }}
        >
          ▶
        </button>
      </div>

      <div style={{ border: "1px solid #e0e0e0", borderRadius: 8, overflow: "hidden" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            backgroundColor: "#f5f5f5",
            fontSize: "0.7rem",
            fontWeight: "600",
          }}
        >
          {WEEKDAYS.map((w) => (
            <div
              key={w}
              style={{ padding: "6px 4px", textAlign: "center", borderBottom: "1px solid #e0e0e0" }}
            >
              {w}
            </div>
          ))}
        </div>
        {weekRows.map((row, ri) => (
          <div key={ri} style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
            {row.map((cell, ci) => {
              if (!cell.date) {
                return (
                  <div key={ci} style={{ minHeight: 36, border: "1px solid #eee" }} />
                );
              }
              const inRange = inTxRange(cell.date);
              const isBlock = cell.seg?.type === "block";
              const isGap = cell.seg?.type === "gap";
              const block = cell.seg?.type === "block" ? cell.seg.block : null;
              const bg = isBlock && block
                ? blockColorMap.get(block.id) ?? "#e3f2fd"
                : isGap
                  ? "#f0f0f0"
                  : inRange
                    ? "#fafafa"
                    : "#fafafa";
              const isBlockStart = isBlock && block && cell.date === block.startDate;
              const isBlockEnd = isBlock && block && cell.date === block.endDate;
              const samePrev = sameSegmentPrev(cell.date, cell.seg);
              const sameNext = sameSegmentNext(cell.date, cell.seg);
              const borderLeft = samePrev ? "none" : isGap ? "1px dashed #999" : "1px solid #e0e0e0";
              const borderRight = sameNext ? "none" : isGap ? "1px dashed #999" : "1px solid #e0e0e0";
              return (
                <div
                  key={ci}
                  style={{
                    minHeight: 40,
                    padding: 4,
                    borderTop: isGap ? "1px dashed #999" : "1px solid #e0e0e0",
                    borderBottom: isGap ? "1px dashed #999" : "1px solid #e0e0e0",
                    borderLeft,
                    borderRight,
                    backgroundColor: bg,
                    fontSize: "0.75rem",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    color: isGap ? "#666" : "#333",
                    borderRadius: isBlockStart && isBlockEnd ? 6 : isBlockStart ? "6px 0 0 6px" : isBlockEnd ? "0 6px 6px 0" : 0,
                    cursor: "default",
                  }}
                  title={tooltipFor(cell)}
                >
                  <span>{new Date(cell.date + "T12:00:00Z").getUTCDate()}</span>
                  {isBlockStart && block ? (
                    <span
                      style={{
                        fontSize: "0.65rem",
                        fontWeight: "600",
                        marginTop: 2,
                        maxWidth: "100%",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {block.title}
                    </span>
                  ) : null}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 16, marginTop: 8, fontSize: "0.8rem", color: "#666", flexWrap: "wrap" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 14, height: 14, backgroundColor: "#e3f2fd", border: "1px solid #e0e0e0" }} /> Block
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 14, height: 14, backgroundColor: "#f0f0f0", border: "2px dashed #999" }} /> —
        </span>
      </div>
    </div>
  );
}
