/**
 * addBlockWithAutoSplit: adding blocks keeps non-overlap and transaction range sync.
 */
import { describe, it, expect, beforeAll } from "vitest";
import { buildTransactionFromTemplateSpec } from "@/lib/build-transaction-from-spec";
import * as store from "@/lib/transaction-engine/store";
import type { TemplateSpec } from "@/lib/template-spec.schema";
import { addDays, daysBetween } from "@/lib/transaction-engine/dateUtils";

const ONE_BLOCK_SPEC: TemplateSpec = {
  blocks: [
    {
      sequence: 1,
      title_key: "block1",
      amount: { type: "FULL" },
      approval: { role: "buyer", auto: false },
    },
  ],
};

function blocksOverlap(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string
): boolean {
  return aStart <= bEnd && bStart <= aEnd;
}

describe("addBlockWithAutoSplit", () => {
  beforeAll(() => {
    expect(process.env.TRANSACTION_ENGINE_DATA_FILE).toBeDefined();
  });

  it("1 block → addBlock → 2 blocks → addBlock → 3 blocks; transaction dates are derived from blocks", () => {
    const today = new Date().toISOString().slice(0, 10);
    const endDefault = addDays(today, 30);

    const graph = buildTransactionFromTemplateSpec(ONE_BLOCK_SPEC, {
      title: "Auto-split test",
      initiatorId: "test-initiator",
      initiatorRole: "BUYER",
      startDate: today,
      endDate: endDefault,
    });

    expect(graph.blocks.length).toBe(1);
    store.saveTransactionGraph(graph);
    const id = graph.transaction.id;
    store.addBlockWithAutoSplit(id, { title: "Block 2", orderIndex: 2 });
    let blocks = store.getBlocks(id);
    expect(blocks.length).toBe(2);

    store.addBlockWithAutoSplit(id, { title: "Block 3", orderIndex: 3 });
    blocks = store.getBlocks(id);
    expect(blocks.length).toBe(3);

    for (let i = 0; i < blocks.length; i++) {
      for (let j = i + 1; j < blocks.length; j++) {
        const a = blocks[i];
        const b = blocks[j];
        expect(blocksOverlap(a.startDate, a.endDate, b.startDate, b.endDate)).toBe(false);
      }
    }

    const minStart = blocks.reduce((min, b) => (b.startDate < min ? b.startDate : min), blocks[0].startDate);
    const maxEnd = blocks.reduce((max, b) => (b.endDate > max ? b.endDate : max), blocks[0].endDate);
    const tx = store.getTransaction(id)!;
    expect(tx.startDate).toBe(minStart);
    expect(tx.endDate).toBe(maxEnd);
    expect(daysBetween(tx.startDate!, tx.endDate!)).toBeGreaterThanOrEqual(daysBetween(today, endDefault));
  });
});
