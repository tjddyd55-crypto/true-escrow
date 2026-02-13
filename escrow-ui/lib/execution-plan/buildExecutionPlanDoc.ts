/**
 * TransactionGraph → ExecutionPlanDoc (pure, read-only).
 * Preview와 PDF가 동일한 DocumentModel 사용.
 * 빈 거래/날짜 없음 방어, 승인/조건/지급 표시 규칙 고정.
 */

import type { TransactionGraph } from "@/lib/transaction-engine/types";
import type { ExecutionPlanDoc } from "./types";
import { daysBetween, addDays } from "@/lib/transaction-engine/dateUtils";

/** Pure: build execution plan document from graph. No side effects. */
export function buildExecutionPlanDoc(graph: TransactionGraph): ExecutionPlanDoc {
  const tx = graph.transaction;
  const startISO = tx.startDate ?? "";
  const endISO = tx.endDate ?? "";
  const totalDays =
    startISO && endISO ? Math.max(0, daysBetween(startISO, endISO)) : undefined;

  const blocks = [...graph.blocks].sort((a, b) => a.orderIndex - b.orderIndex);

  const disclaimerLines = [
    "본 문서는 거래 흐름(실행 계획) 설명용이며 법적 계약서를 대체하지 않습니다.",
    "실제 계약 조건은 별도 계약서를 따릅니다.",
    "문의사항은 플랫폼 운영자에게 연락 바랍니다.",
  ];

  const timeline: ExecutionPlanDoc["timeline"] = [];

  // START
  timeline.push({
    kind: "START",
    title: "executionPlan.start",
    dateStartISO: startISO || undefined,
    dateEndISO: startISO || undefined,
    durationDays: startISO ? 1 : undefined,
    gapFromPrevDays: undefined,
  });

  let prevEnd: string | null = null;

  for (const block of blocks) {
    const blockStart = block.startDate ?? "";
    const blockEnd = block.endDate ?? "";
    const duration =
      blockStart && blockEnd ? Math.max(0, daysBetween(blockStart, blockEnd)) : undefined;

    let gapFromPrev: number | undefined;
    if (prevEnd && blockStart) {
      const gapDays = daysBetween(addDays(prevEnd, 1), blockStart);
      if (gapDays > 0) gapFromPrev = gapDays;
      else if (daysBetween(prevEnd, blockStart) <= 0) gapFromPrev = 0;
    }

    const approvalRoles = graph.blockApprovers
      .filter((a) => a.blockId === block.id)
      .map((a) => a.role);
    const conditions = graph.workRules
      .filter((r) => r.blockId === block.id)
      .map((r) => r.title?.trim() || r.workType || "executionPlan.conditionFallback");

    timeline.push({
      kind: "BLOCK",
      title: block.title,
      dateStartISO: blockStart || undefined,
      dateEndISO: blockEnd || undefined,
      durationDays: duration,
      gapFromPrevDays: gapFromPrev,
      approvalRoles: approvalRoles.length > 0 ? approvalRoles : undefined,
      conditions: conditions.length > 0 ? conditions : undefined,
      payoutRule: "UNSET", // Engine Block has no amount; template-only.
    });

    prevEnd = blockEnd || prevEnd;
  }

  // END (날짜 없으면 END도 생략하지 않고, date만 비움)
  timeline.push({
    kind: "END",
    title: "executionPlan.end",
    dateStartISO: endISO || undefined,
    dateEndISO: endISO || undefined,
    durationDays: endISO ? 1 : undefined,
    gapFromPrevDays:
      prevEnd && endISO
        ? Math.max(0, daysBetween(addDays(prevEnd, 1), endISO))
        : undefined,
  });

  return {
    generatedAtISO: new Date().toISOString(),
    transaction: {
      id: tx.id,
      title: tx.title,
      description: tx.description,
      startDateISO: tx.startDate,
      endDateISO: tx.endDate,
      parties:
        tx.buyerId || tx.sellerId
          ? { buyerId: tx.buyerId, sellerId: tx.sellerId }
          : undefined,
    },
    summary: {
      totalDays,
      blockCount: blocks.length,
    },
    timeline,
    disclaimerLines,
  };
}
