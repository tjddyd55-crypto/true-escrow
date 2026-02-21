import { NextRequest, NextResponse } from "next/server";
import * as store from "@/lib/transaction-engine/store";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ blockId: string }> }
) {
  try {
    const { blockId } = await params;
    const body = (await request.json()) as {
      newDueDate?: string;
      decidedBy?: "BUYER" | "SELLER";
      reason?: string;
    };
    if (!body.newDueDate) {
      return NextResponse.json({ ok: false, error: "newDueDate is required" }, { status: 400 });
    }
    const block = store.extendBlockDueDate(blockId, {
      newDueDate: body.newDueDate,
      decidedBy: body.decidedBy ?? "BUYER",
      reason: body.reason,
    });
    return NextResponse.json({ ok: true, data: block });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  }
}
