/**
 * addBlockWithAutoSplit: template 1 block → addBlock → 2 blocks → addBlock → 3 blocks.
 * Assert: block date sum = transaction period, no overlap.
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

describe("addBlockWithAutoSplit (auto-split when no room)", () => {
  beforeAll(() => {
    expect(process.env.TRANSACTION_ENGINE_DATA_FILE).toBeDefined();
  });

  it("1 block → addBlock → 2 blocks → addBlock → 3 blocks; sum of block days = tx period; no overlap", () => {
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
    const tx = store.getTransaction(id)!;
    const txDays = daysBetween(tx.startDate!, tx.endDate!);

    store.addBlockWithAutoSplit(id, { title: "Block 2", orderIndex: 2 });
    let blocks = store.getBlocks(id);
    expect(blocks.length).toBe(2);

    store.addBlockWithAutoSplit(id, { title: "Block 3", orderIndex: 3 });
    blocks = store.getBlocks(id);
    expect(blocks.length).toBe(3);

    const sumBlockDays = blocks.reduce(
      (sum, b) => sum + daysBetween(b.startDate, b.endDate),
      0
    );
    expect(sumBlockDays).toBe(txDays);

    for (let i = 0; i < blocks.length; i++) {
      for (let j = i + 1; j < blocks.length; j++) {
        const a = blocks[i];
        const b = blocks[j];
        expect(blocksOverlap(a.startDate, a.endDate, b.startDate, b.endDate)).toBe(false);
      }
    }
  });
});
