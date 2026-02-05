import { NextRequest, NextResponse } from "next/server";
import * as store from "@/lib/transaction-engine/store";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ blockId: string; approverId: string }> }
) {
  try {
    const { approverId } = await params;
    store.deleteBlockApprover(approverId);
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ blockId: string; approverId: string }> }
) {
  try {
    const { approverId } = await params;
    const body = await request.json();
    
    const approver = store.updateBlockApprover(approverId, {
      required: body.required,
      role: body.role,
      userId: body.userId,
    });
    
    return NextResponse.json({ ok: true, data: approver });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  }
}
