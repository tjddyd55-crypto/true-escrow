"use client";

import type { ExecutionPlanDoc } from "@/lib/execution-plan/types";
import { formatShortRange } from "@/lib/transaction-engine/dateUtils";

type TimelineItem = ExecutionPlanDoc["timeline"][number];

type Props = {
  doc: ExecutionPlanDoc;
  /** Resolve i18n key to display string (e.g. tKey). */
  tKey: (key: string) => string;
  /** Labels for executionPlan.start, executionPlan.end, etc. */
  t: { executionPlan?: Record<string, string> } & Record<string, unknown>;
};

function formatDuration(t: Props["t"], n?: number): string {
  if (n == null) return "";
  const template = t.executionPlan?.durationDays;
  return typeof template === "string" ? template.replace("{n}", String(n)) : `${n} days`;
}

function formatGap(t: Props["t"], n?: number): string {
  if (n == null || n <= 0) return "";
  const label = t.executionPlan?.daysElapsed ?? "({n} days elapsed)";
  return typeof label === "string" ? label.replace("{n}", String(n)) : "";
}

export function ExecutionPlanTimeline({ doc, tKey, t }: Props) {
  return (
    <div className="execution-plan-timeline" style={{ position: "relative", paddingLeft: "24px" }}>
      {/* vertical line */}
      <div
        style={{
          position: "absolute",
          left: "7px",
          top: "8px",
          bottom: "8px",
          width: "2px",
          background: "#e5e7eb",
          borderRadius: "1px",
        }}
      />

      {doc.timeline.map((item, index) => (
        <TimelineNode
          key={index}
          item={item}
          tKey={tKey}
          t={t}
          formatDuration={(n) => formatDuration(t, n)}
          formatGap={(n) => formatGap(t, n)}
        />
      ))}
    </div>
  );
}

function TimelineNode({
  item,
  tKey,
  t,
  formatDuration,
  formatGap,
}: {
  item: TimelineItem;
  tKey: (key: string) => string;
  t: Props["t"];
  formatDuration: (n?: number) => string;
  formatGap: (n?: number) => string;
}) {
  const isStart = item.kind === "START";
  const isEnd = item.kind === "END";
  const isBlock = item.kind === "BLOCK";

  let title = item.title;
  if (isStart) title = t.executionPlan?.start ?? "Transaction start";
  if (isEnd) title = t.executionPlan?.end ?? "Transaction end";
  if (isBlock && (item.title.startsWith("template.") || item.title.includes("executionPlan.") || item.title.includes("block_"))) {
    title = tKey(item.title) || item.title;
  }

  const gapLabel = item.gapFromPrevDays != null && item.gapFromPrevDays > 0
    ? formatGap(item.gapFromPrevDays)
    : null;

  return (
    <div style={{ position: "relative", marginBottom: "16px" }}>
      {gapLabel && (
        <div
          style={{
            marginBottom: "8px",
            paddingLeft: "8px",
            fontSize: "0.875rem",
            color: "#6b7280",
          }}
        >
          {gapLabel}
        </div>
      )}

      <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
        {/* dot */}
        <div
          style={{
            position: "absolute",
            left: "-21px",
            width: "16px",
            height: "16px",
            borderRadius: "50%",
            background: isBlock ? "#3b82f6" : "#9ca3af",
            border: "2px solid white",
            boxShadow: "0 0 0 2px #e5e7eb",
            flexShrink: 0,
          }}
        />

        {/* card */}
        <div
          style={{
            flex: 1,
            padding: "12px 16px",
            background: isBlock ? "#f8fafc" : "#f1f5f9",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            minWidth: 0,
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: "4px" }}>{title}</div>
          {(item.dateStartISO || item.dateEndISO) ? (
            <div style={{ fontSize: "0.875rem", color: "#64748b", marginBottom: "6px" }}>
              {item.dateStartISO && item.dateEndISO
                ? formatShortRange(item.dateStartISO, item.dateEndISO)
                : item.dateStartISO ?? item.dateEndISO}
              {item.durationDays != null && ` · ${formatDuration(item.durationDays)}`}
            </div>
          ) : (
            <div style={{ fontSize: "0.875rem", color: "#94a3b8", marginBottom: "6px" }}>
              {t.executionPlan?.dateUnset ?? "Date not set"}
            </div>
          )}
          {isBlock && (
            <>
              {item.approvalRoles && item.approvalRoles.length > 0 && (
                <div style={{ fontSize: "0.875rem", marginTop: "6px" }}>
                  <span style={{ color: "#64748b" }}>{t.executionPlan?.approvals ?? "Approvals"}: </span>
                  {item.approvalRoles.map((r) => r === "BUYER" ? tKey("executionPlan.approvalBuyer") : r === "SELLER" ? tKey("executionPlan.approvalSeller") : r === "ADMIN" ? tKey("executionPlan.approvalAdmin") : tKey("executionPlan.approvalVerifier")).join(", ")}
                </div>
              )}
              {item.conditions && item.conditions.length > 0 && (
                <div style={{ fontSize: "0.875rem", marginTop: "4px" }}>
                  <span style={{ color: "#64748b" }}>{t.executionPlan?.conditions ?? "Conditions"}: </span>
                  {item.conditions.map((c) => (c.startsWith("executionPlan.") || c.includes("template.") ? tKey(c) : c)).join(", ")}
                </div>
              )}
              {item.payoutRule && (
                <div style={{ fontSize: "0.875rem", marginTop: "4px" }}>
                  <span style={{ color: "#64748b" }}>{t.executionPlan?.payoutRule ?? "Payout"}: </span>
                  {item.payoutRule === "UNSET" ? (tKey("executionPlan.payoutUnset")) : item.payoutRule.startsWith("RATIO:") ? tKey("executionPlan.payoutRatio").replace("{pct}", item.payoutRule.slice(6)) : item.payoutRule.startsWith("FIXED:") ? tKey("executionPlan.payoutFixed").replace("{amount}", item.payoutRule.slice(6)) : item.payoutRule === "FULL" ? tKey("executionPlan.payoutFull") : item.payoutRule === "NONE" ? tKey("executionPlan.payoutNone") : item.payoutRule}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
