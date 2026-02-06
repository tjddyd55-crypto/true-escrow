import { NextRequest, NextResponse } from "next/server";
import * as store from "@/lib/transaction-engine/store";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const transactionId = body.transactionId;
    if (!transactionId) {
      return NextResponse.json({ ok: false, error: "transactionId required" }, { status: 400 });
    }

    // Suggested default: startDate = previousBlock.endDate + 1, endDate = transaction.endDate (suggestions only)
    let startDate = body.startDate;
    let endDate = body.endDate;
    if (startDate === undefined || endDate === undefined) {
      const suggested = store.getSuggestedBlockDates(transactionId);
      if (!suggested) {
        return NextResponse.json(
          { ok: false, error: "No room for another block within transaction date range" },
          { status: 400 }
        );
      }
      startDate = startDate ?? suggested.startDate;
      endDate = endDate ?? suggested.endDate;
    }

    const policy = store.createApprovalPolicy({
      type: body.approvalType || "SINGLE",
      threshold: body.threshold,
    });

    const existingBlocks = store.getBlocks(transactionId);
    const orderIndex = body.orderIndex ?? existingBlocks.length + 1;

    const block = store.addBlock(transactionId, {
      title: body.title ?? `Block ${orderIndex}`,
      startDate,
      endDate,
      orderIndex,
      approvalPolicyId: policy.id,
    });

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
