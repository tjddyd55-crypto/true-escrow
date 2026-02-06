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
    
    // Update transaction fields (only in DRAFT)
    if (transaction.status !== "DRAFT") {
      return NextResponse.json({ ok: false, error: "Transaction can only be updated in DRAFT status" }, { status: 400 });
    }
    
    if (body.title !== undefined) transaction.title = body.title;
    if (body.description !== undefined) transaction.description = body.description;
    if (body.startDate !== undefined) transaction.startDate = body.startDate;
    if (body.endDate !== undefined) transaction.endDate = body.endDate;
    
    // Save updated graph
    const blocks = store.getBlocks(id);
    const graph = {
      transaction,
      blocks,
      approvalPolicies: blocks.map((b) => store.getApprovalPolicy(b.approvalPolicyId)).filter(Boolean) as any[],
      blockApprovers: blocks.flatMap((b) => store.getBlockApprovers(b.id)),
      workRules: blocks.flatMap((b) => store.getWorkRules(b.id)),
      workItems: blocks.flatMap((b) => store.getWorkItemsByBlock(b.id)),
    };
    store.saveTransactionGraph(graph);
    
    return NextResponse.json({ ok: true, data: transaction });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
