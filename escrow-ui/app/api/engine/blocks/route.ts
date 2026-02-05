import { NextRequest, NextResponse } from "next/server";
import * as store from "@/lib/transaction-engine/store";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Create approval policy first
    const policy = store.createApprovalPolicy({
      type: body.approvalType || "SINGLE",
      threshold: body.threshold,
    });
    
    // Create block
    const block = store.addBlock(body.transactionId, {
      title: body.title,
      startDay: body.startDay,
      endDay: body.endDay,
      orderIndex: body.orderIndex,
      approvalPolicyId: policy.id,
      isActive: false,
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
