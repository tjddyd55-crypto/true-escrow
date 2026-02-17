import { NextRequest, NextResponse } from "next/server";
import * as store from "@/lib/transaction-engine/store";
import { canApproveBlock } from "@/lib/transaction-engine/block-approval";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ blockId: string }> }
) {
  try {
    const { blockId } = await params;
    const block = store.getBlockById(blockId);
    if (!block) {
      return NextResponse.json({ ok: false, error: "Block not found" }, { status: 404 });
    }
    const result = await canApproveBlock({ tradeId: block.transactionId, blockId });
    if (!result.canApprove) {
      return NextResponse.json(
        { ok: false, error: result.reason ?? "Block cannot be approved", data: { missingRequired: result.missingRequired } },
        { status: 400 }
      );
    }
    const approvedBlock = store.approveBlock(blockId);
    return NextResponse.json({ ok: true, data: approvedBlock });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  }
}
