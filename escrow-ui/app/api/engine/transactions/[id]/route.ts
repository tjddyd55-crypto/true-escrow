import { NextRequest, NextResponse } from "next/server";
import * as store from "@/lib/transaction-engine/store";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const transaction = store.getTransaction(id);
    if (!transaction) {
      return NextResponse.json({ ok: false, error: "Transaction not found" }, { status: 404 });
    }
    
    const blocks = store.getBlocks(params.id);
    const graph = {
      transaction,
      blocks,
      approvalPolicies: blocks.map((b) => store.getApprovalPolicy(b.approvalPolicyId)).filter(Boolean) as any[],
      blockApprovers: blocks.flatMap((b) => store.getBlockApprovers(b.id)),
      workRules: blocks.flatMap((b) => store.getWorkRules(b.id)),
      workItems: blocks.flatMap((b) => store.getWorkItemsByBlock(b.id)),
    };
    
    return NextResponse.json({ ok: true, data: graph });
  } catch (error: any) {
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
