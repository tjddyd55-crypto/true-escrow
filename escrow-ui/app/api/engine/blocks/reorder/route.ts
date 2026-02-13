import { NextRequest, NextResponse } from "next/server";
import * as store from "@/lib/transaction-engine/store";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { transactionId?: string; blockIds?: string[] };
    const transactionId = body.transactionId;
    const blockIds = Array.isArray(body.blockIds) ? body.blockIds : [];
    if (!transactionId) {
      return NextResponse.json(
        { ok: false, error: "transactionId required" },
        { status: 400 }
      );
    }

    const existing = store.getBlocks(transactionId);
    const existingIds = new Set(existing.map((b) => b.id));
    const requestedSet = new Set(blockIds);
    if (blockIds.length !== existingIds.size || blockIds.some((id) => !existingIds.has(id))) {
      return NextResponse.json(
        { ok: false, error: "blockIds must match exactly the blocks for this transaction" },
        { status: 400 }
      );
    }

    const orderByNewIndex = new Map(blockIds.map((id, idx) => [id, idx + 1]));
    const reordered = existing
      .map((b) => ({ ...b, orderIndex: orderByNewIndex.get(b.id) ?? b.orderIndex }))
      .sort((a, b) => a.orderIndex - b.orderIndex);

    const graph = {
      transaction: store.getTransaction(transactionId)!,
      blocks: reordered,
      approvalPolicies: reordered.flatMap((b) => {
        const p = store.getApprovalPolicy(b.approvalPolicyId);
        return p ? [p] : [];
      }),
      blockApprovers: reordered.flatMap((b) => store.getBlockApprovers(b.id)),
      workRules: reordered.flatMap((b) => store.getWorkRules(b.id)),
      workItems: reordered.flatMap((b) => store.getWorkItemsByBlock(b.id)),
    };
    store.saveTransactionGraph(graph);
    return NextResponse.json({ ok: true, data: graph.blocks });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Failed to reorder blocks";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
