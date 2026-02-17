import { describe, it, expect } from "vitest";
import { buildTemplateSnapshot, allocateDatesByDurations } from "../templateSnapshot";
import type { TransactionGraph } from "@/lib/transaction-engine/types";

describe("template snapshot", () => {
  it("preserves source structure without mutating graph", () => {
    const graph: TransactionGraph = {
      transaction: {
        id: "tx1",
        title: "Trade",
        initiatorId: "u1",
        initiatorRole: "BUYER",
        status: "DRAFT",
        createdAt: new Date().toISOString(),
        startDate: "2026-02-01",
        endDate: "2026-02-10",
      },
      blocks: [
        {
          id: "b1",
          transactionId: "tx1",
          title: "B1",
          startDate: "2026-02-01",
          endDate: "2026-02-05",
          orderIndex: 0,
          approvalPolicyId: "p1",
          isActive: false,
        },
      ],
      approvalPolicies: [{ id: "p1", type: "SINGLE" }],
      blockApprovers: [{ id: "a1", blockId: "b1", role: "BUYER", required: true }],
      workRules: [],
      workItems: [],
    };
    const before = JSON.stringify(graph);
    const snap = buildTemplateSnapshot({
      graph,
      questionsByBlockId: {
        b1: [{ type: "SHORT_TEXT", label: "Q1", description: null, required: true, options: {} }],
      },
    });
    expect(snap.blocks).toHaveLength(1);
    expect(snap.blocks[0].questions).toHaveLength(1);
    expect(JSON.stringify(graph)).toBe(before);
  });

  it("allocates date ranges proportionally in target period", () => {
    const ranges = allocateDatesByDurations({
      startDate: "2026-02-01",
      endDate: "2026-02-10",
      durations: [2, 3, 5],
    });
    expect(ranges).toHaveLength(3);
    expect(ranges[0].startDate).toBe("2026-02-01");
    expect(ranges[2].endDate).toBe("2026-02-10");
  });
});
