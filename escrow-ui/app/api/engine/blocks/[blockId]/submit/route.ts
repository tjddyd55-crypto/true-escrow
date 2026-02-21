import { NextRequest, NextResponse } from "next/server";
import * as store from "@/lib/transaction-engine/store";
import { canApproveBlock } from "@/lib/transaction-engine/block-approval";
import { evaluateAndApplyBlockPolicy } from "@/lib/transaction-engine/block-policy-evaluator";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ blockId: string }> }
) {
  try {
    const { blockId } = await params;
    const block = store.getBlockById(blockId);
    if (!block) {
      return NextResponse.json({ ok: false, error: "Block not found" }, { status: 404 });
    }
    const readiness = await canApproveBlock({ tradeId: block.transactionId, blockId });
    if (!readiness.canApprove) {
      return NextResponse.json(
        { ok: false, error: readiness.reason ?? "Required questions are not satisfied", data: { missingRequired: readiness.missingRequired } },
        { status: 400 }
      );
    }
    store.submitBlock(blockId);
    const policyState = await evaluateAndApplyBlockPolicy({
      tradeId: block.transactionId,
      blockId,
    });
    return NextResponse.json({
      ok: true,
      data: {
        block: store.getBlockById(blockId),
        policy: policyState,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  }
}
