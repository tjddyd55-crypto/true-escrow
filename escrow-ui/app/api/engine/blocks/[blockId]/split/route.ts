import { NextRequest, NextResponse } from "next/server";
import * as store from "@/lib/transaction-engine/store";
import { addDays } from "@/lib/transaction-engine/dateUtils";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ blockId: string }> }
) {
  try {
    const { blockId } = await params;
    const body = await request.json();
    let splitDate: string;
    if (body.splitDate && typeof body.splitDate === "string") {
      splitDate = body.splitDate;
    } else if (typeof body.splitDay === "number" && body.transactionId) {
      const tx = store.getTransaction(body.transactionId);
      const base = tx?.startDate ?? new Date().toISOString().slice(0, 10);
      splitDate = addDays(base, body.splitDay - 1);
    } else {
      return NextResponse.json({ ok: false, error: "splitDate (YYYY-MM-DD) or splitDay + transactionId required" }, { status: 400 });
    }
    const result = store.splitBlock(blockId, splitDate);
    return NextResponse.json({ ok: true, data: result });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  }
}
