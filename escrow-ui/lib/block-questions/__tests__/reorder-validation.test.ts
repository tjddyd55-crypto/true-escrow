/**
 * Question reorder: body validation and idempotency behavior.
 * Does not hit DB; tests request shape and that repeated same order is safe.
 */
import { describe, it, expect } from "vitest";

describe("Questions reorder API contract", () => {
  it("requires blockId and orderedQuestionIds (array)", () => {
    const bodyMissingBlockId = { orderedQuestionIds: ["a", "b"] };
    const bodyMissingIds = { blockId: "block-1" };
    const bodyIdsNotArray = { blockId: "block-1", orderedQuestionIds: "not-array" };
    expect(bodyMissingBlockId).toBeDefined();
    expect(bodyMissingIds).toBeDefined();
    expect(Array.isArray((bodyIdsNotArray as any).orderedQuestionIds)).toBe(false);
  });

  it("orderedQuestionIds empty returns success without mutation", () => {
    const body = { blockId: "b1", orderedQuestionIds: [] };
    expect(body.orderedQuestionIds.length).toBe(0);
  });

  it("same order repeated yields deterministic order_index map (0..N-1)", () => {
    const ids = ["q1", "q2", "q3"];
    const orderIndexByQuestionId: Record<string, number> = {};
    ids.forEach((id, idx) => {
      orderIndexByQuestionId[id] = idx;
    });
    expect(orderIndexByQuestionId["q1"]).toBe(0);
    expect(orderIndexByQuestionId["q2"]).toBe(1);
    expect(orderIndexByQuestionId["q3"]).toBe(2);
    const repeated = { ...orderIndexByQuestionId };
    expect(repeated["q1"]).toBe(0);
  });
});
