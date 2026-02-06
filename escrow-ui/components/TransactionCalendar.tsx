"use client";

import type { Block, TimelineSegment } from "@/lib/transaction-engine/types";
import { getSegmentAtDate, getTimelineSegments } from "@/lib/transaction-engine/timelineSegments";
import { addDays, daysBetween, formatShortDate } from "@/lib/transaction-engine/dateUtils";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type Props = {
  txStartDate: string;
  txEndDate: string;
  blocks: Block[];
  title?: string;
};

/**
 * Calendar view of transaction range. Every day in [txStartDate, txEndDate] is colored:
 * - Block days: solid background (blue tint)
 * - Gap days: grey, dashed border style
 * No uncolored dates within transaction range.
 */
export function TransactionCalendar({ txStartDate, txEndDate, blocks, title }: Props) {
  const segments = getTimelineSegments(txStartDate, txEndDate, blocks);
  const totalDays = daysBetween(txStartDate, txEndDate);
  if (totalDays <= 0) return null;

  const start = new Date(txStartDate + "T12:00:00Z");
  const startWeekday = start.getUTCDay();
  const paddingStart = startWeekday;

  const days: { date: string; seg: TimelineSegment | undefined }[] = [];
  for (let i = 0; i < totalDays; i++) {
    const date = addDays(txStartDate, i);
    const seg = getSegmentAtDate(segments, date);
    days.push({ date, seg });
  }

  const weekRows: { date: string; seg: TimelineSegment | undefined }[][] = [];
  let row: { date: string; seg: TimelineSegment | undefined }[] = [];
  for (let p = 0; p < paddingStart; p++) {
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

  return (
    <div style={{ marginBottom: 24 }}>
      {title && <h3 style={{ fontSize: "1.1rem", marginBottom: 10 }}>{title}</h3>}
      <div style={{ border: "1px solid #e0e0e0", borderRadius: 8, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", backgroundColor: "#f5f5f5", fontSize: "0.7rem", fontWeight: "600" }}>
          {WEEKDAYS.map((w) => (
            <div key={w} style={{ padding: "6px 4px", textAlign: "center", borderBottom: "1px solid #e0e0e0" }}>
              {w}
            </div>
          ))}
        </div>
        {weekRows.map((row, ri) => (
          <div key={ri} style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
            {row.map((cell, ci) => {
              if (!cell.date) {
                return <div key={ci} style={{ minHeight: 32, border: "1px solid #eee" }} />;
              }
              const isBlock = cell.seg?.type === "block";
              const isGap = cell.seg?.type === "gap";
              return (
                <div
                  key={ci}
                  style={{
                    minHeight: 32,
                    padding: 2,
                    border: isGap ? "1px dashed #999" : "1px solid #e0e0e0",
                    backgroundColor: isBlock ? "#e3f2fd" : isGap ? "#f0f0f0" : "#fafafa",
                    fontSize: "0.75rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: isGap ? "#666" : "#333",
                  }}
                  title={
                    cell.seg?.type === "block"
                      ? `${cell.seg.block.title}: ${formatShortDate(cell.date)}`
                      : cell.seg?.type === "gap"
                        ? `Idle Period: ${formatShortDate(cell.date)}`
                        : formatShortDate(cell.date)
                  }
                >
                  {new Date(cell.date + "T12:00:00Z").getUTCDate()}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 16, marginTop: 8, fontSize: "0.8rem", color: "#666" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 14, height: 14, backgroundColor: "#e3f2fd", border: "1px solid #e0e0e0" }} /> Block
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 14, height: 14, backgroundColor: "#f0f0f0", border: "2px dashed #999" }} /> Idle Period
        </span>
      </div>
    </div>
  );
}
