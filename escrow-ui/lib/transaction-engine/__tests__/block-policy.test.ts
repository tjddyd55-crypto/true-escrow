import { describe, expect, it } from "vitest";
import { evaluateBlockTransition, isAutoEligible, isFormallyCompleted } from "@/lib/transaction-engine/block-policy";
import type { Block } from "@/lib/transaction-engine/types";

function makeBlock(patch: Partial<Block> = {}): Block {
  return {
    id: "b1",
    transactionId: "t1",
    title: "Block 1",
    startDate: "2026-02-01",
    endDate: "2026-02-05",
    dueDate: "2026-02-05",
    orderIndex: 0,
    approvalPolicyId: "p1",
    isActive: true,
    approvalMode: "MANUAL_REVIEW_REQUIRED",
    reviewTimeoutHours: 24,
    status: "IN_PROGRESS",
    extensions: [],
    ...patch,
  };
}

describe("block policy", () => {
  it("forbids AUTO_RELEASE when attachment question exists", () => {
    const eligible = isAutoEligible({
      approvalMode: "AUTO_RELEASE",
      hasAttachmentQuestion: true,
    });
    expect(eligible).toBe(false);
  });

  it("moves to SUBMITTED after formal completion", () => {
    const result = evaluateBlockTransition({
      block: makeBlock(),
      now: new Date("2026-02-03T00:00:00.000Z"),
      formallyCompleted: true,
      autoEligible: true,
    });
    expect(result.nextStatus).toBe("SUBMITTED");
  });

  it("auto-approves after timeout in AUTO_APPROVE_THEN_RELEASE", () => {
    const block = makeBlock({
      status: "REVIEWING",
      approvalMode: "AUTO_APPROVE_THEN_RELEASE",
      submittedAt: "2026-02-01T00:00:00.000Z",
      reviewTimeoutHours: 24,
    });
    const result = evaluateBlockTransition({
      block,
      now: new Date("2026-02-03T01:00:00.000Z"),
      formallyCompleted: true,
      autoEligible: true,
    });
    expect(result.nextStatus).toBe("APPROVED");
  });

  it("auto-disputes after timeout in AUTO_DISPUTE_IF_NO_RESPONSE", () => {
    const block = makeBlock({
      status: "REVIEWING",
      approvalMode: "AUTO_DISPUTE_IF_NO_RESPONSE",
      submittedAt: "2026-02-01T00:00:00.000Z",
      reviewTimeoutHours: 24,
    });
    const result = evaluateBlockTransition({
      block,
      now: new Date("2026-02-03T01:00:00.000Z"),
      formallyCompleted: true,
      autoEligible: true,
    });
    expect(result.nextStatus).toBe("DISPUTED");
  });

  it("becomes OVERDUE when not completed and due date passed", () => {
    const block = makeBlock({ dueDate: "2026-02-02", status: "IN_PROGRESS" });
    const result = evaluateBlockTransition({
      block,
      now: new Date("2026-02-04T00:00:00.000Z"),
      formallyCompleted: false,
      autoEligible: true,
    });
    expect(result.nextStatus).toBe("OVERDUE");
  });

  it("formal completion true only when missing required is zero", () => {
    expect(isFormallyCompleted({ missingRequiredCount: 0 })).toBe(true);
    expect(isFormallyCompleted({ missingRequiredCount: 1 })).toBe(false);
  });
});
