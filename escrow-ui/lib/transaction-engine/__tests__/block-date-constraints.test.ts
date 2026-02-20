/**
 * Block date constraints: no overlap + transaction range is derived from blocks.
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

  it("updateBlock allows extending outside initial transaction range and updates transaction dates", () => {
    const updated = store.updateBlock(blockId, {
      startDate: "2025-01-15",
      endDate: "2025-03-15",
    });
    expect(updated.startDate).toBe("2025-01-15");
    expect(updated.endDate).toBe("2025-03-15");
    const tx = store.getTransaction(transactionId)!;
    expect(tx.startDate).toBe("2025-01-15");
    expect(tx.endDate).toBe("2025-03-15");
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

  it("addBlock expands transaction range from block min/max", () => {
    store.addBlock(transactionId, {
      title: "Late Block",
      startDate: "2025-03-01",
      endDate: "2025-03-10",
      orderIndex: 2,
      approvalPolicyId: store.createApprovalPolicy({ type: "SINGLE" }).id,
    });
    const tx = store.getTransaction(transactionId)!;
    expect(tx.startDate).toBe("2025-02-05");
    expect(tx.endDate).toBe("2025-03-10");
  });
});
