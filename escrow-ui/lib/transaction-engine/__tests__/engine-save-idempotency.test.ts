/**
 * Idempotency: create from template (2 workRules) → change date 10 times → workRules must still be 2.
 * Ensures replace-only save; no accumulation from PATCH/date change.
 */
import { describe, it, expect, beforeAll } from "vitest";
import { buildTransactionFromTemplateSpec } from "@/lib/build-transaction-from-spec";
import * as store from "@/lib/transaction-engine/store";
import type { TemplateSpec } from "@/lib/template-spec.schema";
import { addDays } from "@/lib/transaction-engine/dateUtils";

const TWO_BLOCK_SPEC: TemplateSpec = {
  blocks: [
    {
      sequence: 1,
      title_key: "block1",
      amount: { type: "FULL" },
      approval: { role: "buyer", auto: false },
    },
    {
      sequence: 2,
      title_key: "block2",
      amount: { type: "FULL" },
      approval: { role: "seller", auto: false },
    },
  ],
};

describe("Engine save idempotency (no accumulation on date change)", () => {
  beforeAll(() => {
    // Rely on TRANSACTION_ENGINE_DATA_FILE from vitest-setup so we don't touch real .data
    expect(process.env.TRANSACTION_ENGINE_DATA_FILE).toBeDefined();
  });

  it("after 10 date changes, workRules count stays 2 (replace-only save)", () => {
    const today = new Date().toISOString().slice(0, 10);
    const endDefault = addDays(today, 30);

    const graph = buildTransactionFromTemplateSpec(TWO_BLOCK_SPEC, {
      title: "Idempotency test",
      initiatorId: "test-initiator",
      initiatorRole: "BUYER",
      startDate: today,
      endDate: endDefault,
    });

    expect(graph.workRules.length).toBe(2);
    store.saveTransactionGraph(graph);
    const id = graph.transaction.id;

    const getTotalWorkRules = () => {
      const blocks = store.getBlocks(id);
      return blocks.reduce((sum, b) => sum + store.getWorkRules(b.id).length, 0);
    };

    expect(getTotalWorkRules()).toBe(2);

    for (let i = 0; i < 10; i++) {
      const transaction = store.getTransaction(id);
      if (!transaction) throw new Error("Transaction not found");
      const transactionCopy = structuredClone(transaction);
      const offset = i + 1;
      transactionCopy.startDate = addDays(today, offset);
      transactionCopy.endDate = addDays(endDefault, offset);
      const blocks = store.getBlocks(id);
      const updatedGraph = {
        transaction: transactionCopy,
        blocks,
        approvalPolicies: blocks.map((b) => store.getApprovalPolicy(b.approvalPolicyId)).filter(Boolean) as any[],
        blockApprovers: blocks.flatMap((b) => store.getBlockApprovers(b.id)),
        workRules: blocks.flatMap((b) => store.getWorkRules(b.id)),
        workItems: blocks.flatMap((b) => store.getWorkItemsByBlock(b.id)),
      };
      store.saveTransactionGraph(updatedGraph);
    }

    expect(getTotalWorkRules()).toBe(2);
  });
});
