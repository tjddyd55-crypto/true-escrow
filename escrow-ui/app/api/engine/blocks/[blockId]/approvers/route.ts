import { NextRequest, NextResponse } from "next/server";
import * as store from "@/lib/transaction-engine/store";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ blockId: string }> }
) {
  try {
    const { blockId } = await params;
    const body = await request.json();
    
    const approver = store.addBlockApprover({
      blockId,
      role: body.role || "BUYER",
      userId: body.userId || body.displayName, // Use displayName as userId placeholder
      required: body.required !== undefined ? body.required : true,
    });
    
    return NextResponse.json({ ok: true, data: approver });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  }
}
