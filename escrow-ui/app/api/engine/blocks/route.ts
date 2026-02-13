import { NextRequest, NextResponse } from "next/server";
import * as store from "@/lib/transaction-engine/store";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const transactionId = body.transactionId;
    if (!transactionId) {
      return NextResponse.json({ ok: false, error: "transactionId required" }, { status: 400 });
    }

    const existingBlocks = store.getBlocks(transactionId);
    const orderIndex = body.orderIndex ?? existingBlocks.length + 1;

    let block;
    if (body.startDate !== undefined && body.endDate !== undefined) {
      const policy = store.createApprovalPolicy({
        type: body.approvalType || "SINGLE",
        threshold: body.threshold,
      });
      block = store.addBlock(transactionId, {
        title: body.title ?? `Block ${orderIndex}`,
        startDate: body.startDate,
        endDate: body.endDate,
        orderIndex,
        approvalPolicyId: policy.id,
      });
    } else {
      block = store.addBlockWithAutoSplit(transactionId, {
        title: body.title ?? `Block ${orderIndex}`,
        orderIndex,
        approvalType: body.approvalType || "SINGLE",
        threshold: body.threshold,
      });
    }

    return NextResponse.json({ ok: true, data: block });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const block = store.updateBlock(body.id, body.patch || {});
    return NextResponse.json({ ok: true, data: block });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const blockId = searchParams.get("id");
    if (!blockId) {
      return NextResponse.json({ ok: false, error: "Block ID required" }, { status: 400 });
    }
    store.deleteBlock(blockId);
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  }
}
