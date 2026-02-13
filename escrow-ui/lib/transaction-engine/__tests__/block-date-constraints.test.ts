/**
 * Block date constraints: block must be within transaction range; no overlap.
 */
import { describe, it, expect, beforeEach } from "vitest";
import * as store from "@/lib/transaction-engine/store";
import { addDays } from "@/lib/transaction-engine/dateUtils";

describe("Block date constraints", () => {
  let transactionId: string;
  let blockId: string;
  const startDate = "2025-02-01";
  const endDate = "2025-02-28";

  beforeEach(() => {
    const tx = store.createTransaction({
      title: "Date test",
      initiatorId: "u1",
      initiatorRole: "BUYER",
      startDate,
      endDate,
    });
    transactionId = tx.id;
    const block = store.addBlock(transactionId, {
      title: "Block 1",
      startDate: "2025-02-05",
      endDate: "2025-02-10",
      orderIndex: 1,
      approvalPolicyId: store.createApprovalPolicy({ type: "SINGLE" }).id,
    });
    blockId = block.id;
  });

  it("updateBlock rejects startDate before transaction startDate", () => {
    expect(() =>
      store.updateBlock(blockId, { startDate: "2025-01-15", endDate: "2025-02-10" })
    ).toThrow("Block must be within transaction range");
  });

  it("updateBlock rejects endDate after transaction endDate", () => {
    expect(() =>
      store.updateBlock(blockId, { startDate: "2025-02-05", endDate: "2025-03-15" })
    ).toThrow("Block must be within transaction range");
  });

  it("updateBlock accepts dates within transaction range", () => {
    const updated = store.updateBlock(blockId, {
      startDate: "2025-02-06",
      endDate: "2025-02-12",
    });
    expect(updated.startDate).toBe("2025-02-06");
    expect(updated.endDate).toBe("2025-02-12");
  });

  it("addBlock rejects overlapping block dates", () => {
    expect(() =>
      store.addBlock(transactionId, {
        title: "Overlap",
        startDate: "2025-02-08",
        endDate: "2025-02-15",
        orderIndex: 2,
        approvalPolicyId: store.createApprovalPolicy({ type: "SINGLE" }).id,
      })
    ).toThrow("Blocks cannot overlap");
  });
});
