import { NextRequest, NextResponse } from "next/server";
import * as store from "@/lib/transaction-engine/store";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log("[API] GET /api/engine/transactions/[id]", id);
    
    const transaction = store.getTransaction(id);
    if (!transaction) {
      console.error("[API] Transaction not found:", id);
      return NextResponse.json({ ok: false, error: "Transaction not found" }, { status: 404 });
    }
    
    console.log("[API] Transaction found:", transaction.id);
    const blocks = store.getBlocks(id);
    console.log("[API] Blocks found:", blocks.length);
    
    const graph = {
      transaction,
      blocks,
      approvalPolicies: blocks.map((b) => store.getApprovalPolicy(b.approvalPolicyId)).filter(Boolean) as any[],
      blockApprovers: blocks.flatMap((b) => store.getBlockApprovers(b.id)),
      workRules: blocks.flatMap((b) => store.getWorkRules(b.id)),
      workItems: blocks.flatMap((b) => store.getWorkItemsByBlock(b.id)),
    };
    
    console.log("[API] Returning graph:", {
      transactionId: graph.transaction.id,
      blocks: graph.blocks.length,
      workRules: graph.workRules.length,
      workItems: graph.workItems.length,
    });
    
    return NextResponse.json({ ok: true, data: graph });
  } catch (error: any) {
    console.error("[API] Error fetching transaction:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const transaction = store.getTransaction(id);
    if (!transaction) {
      return NextResponse.json({ ok: false, error: "Transaction not found" }, { status: 404 });
    }
    
    // Update transaction fields (only in DRAFT). No TemplateSpec rebuild — load → mutate clone → replace.
    if (transaction.status !== "DRAFT") {
      return NextResponse.json({ ok: false, error: "Transaction can only be updated in DRAFT status" }, { status: 400 });
    }

    const transactionCopy = structuredClone(transaction);
    if (body.title !== undefined) transactionCopy.title = body.title;
    if (body.description !== undefined) transactionCopy.description = body.description;
    if (body.startDate !== undefined) transactionCopy.startDate = body.startDate;
    if (body.endDate !== undefined) transactionCopy.endDate = body.endDate;

    const blocks = store.getBlocks(id);
    const graph = {
      transaction: transactionCopy,
      blocks,
      approvalPolicies: blocks.map((b) => store.getApprovalPolicy(b.approvalPolicyId)).filter(Boolean) as any[],
      blockApprovers: blocks.flatMap((b) => store.getBlockApprovers(b.id)),
      workRules: blocks.flatMap((b) => store.getWorkRules(b.id)),
      workItems: blocks.flatMap((b) => store.getWorkItemsByBlock(b.id)),
    };
    store.saveTransactionGraph(graph);

    return NextResponse.json({ ok: true, data: transactionCopy });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
