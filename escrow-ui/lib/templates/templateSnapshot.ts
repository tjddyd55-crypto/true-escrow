import type { TransactionGraph } from "@/lib/transaction-engine/types";
import { daysBetween, addDays } from "@/lib/transaction-engine/dateUtils";

export type SnapshotQuestion = {
  type: string;
  label: string;
  description: string | null;
  required: boolean;
  options: unknown;
};

export type SnapshotBlock = {
  title: string;
  orderIndex: number;
  durationDays: number;
  approvalPolicyType: string;
  approvalThreshold: number | null;
  approvers: Array<{ role: string; userId?: string; required: boolean }>;
  questions: SnapshotQuestion[];
};

export type TradeTemplateJson = {
  version: 1;
  blocks: SnapshotBlock[];
};

export function buildTemplateSnapshot(input: {
  graph: TransactionGraph;
  questionsByBlockId: Record<string, SnapshotQuestion[]>;
}): TradeTemplateJson {
  const blocks = [...input.graph.blocks]
    .sort((a, b) => a.orderIndex - b.orderIndex)
    .map((b) => {
      const policy = input.graph.approvalPolicies.find((p) => p.id === b.approvalPolicyId);
      const approvers = input.graph.blockApprovers
        .filter((a) => a.blockId === b.id)
        .map((a) => ({ role: a.role, userId: a.userId, required: a.required }));
      const questions = input.questionsByBlockId[b.id] ?? [];
      return {
        title: b.title,
        orderIndex: b.orderIndex,
        durationDays: Math.max(1, daysBetween(b.startDate, b.endDate)),
        approvalPolicyType: policy?.type ?? "SINGLE",
        approvalThreshold: policy?.threshold ?? null,
        approvers,
        questions,
      };
    });

  return { version: 1, blocks };
}

export function allocateDatesByDurations(params: {
  startDate: string;
  endDate: string;
  durations: number[];
}): Array<{ startDate: string; endDate: string }> {
  const totalDays = Math.max(1, daysBetween(params.startDate, params.endDate));
  const safeDurations = params.durations.map((d) => Math.max(1, Math.floor(d)));
  const durationSum = safeDurations.reduce((sum, d) => sum + d, 0);
  const proportional = safeDurations.map((d) => Math.max(1, Math.floor((d / durationSum) * totalDays)));
  let allocatedSum = proportional.reduce((sum, d) => sum + d, 0);
  proportional[proportional.length - 1] += totalDays - allocatedSum;
  allocatedSum = proportional.reduce((sum, d) => sum + d, 0);
  if (allocatedSum !== totalDays) {
    proportional[proportional.length - 1] += totalDays - allocatedSum;
  }

  const ranges: Array<{ startDate: string; endDate: string }> = [];
  let cursor = params.startDate;
  proportional.forEach((d, idx) => {
    const startDate = cursor;
    const endDate = idx === proportional.length - 1 ? params.endDate : addDays(startDate, d - 1);
    ranges.push({ startDate, endDate });
    cursor = addDays(endDate, 1);
  });
  return ranges;
}
