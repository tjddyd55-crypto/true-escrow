import { NextRequest, NextResponse } from "next/server";
import * as store from "@/lib/transaction-engine/store";
import { createTransactionEvent } from "@/lib/trade-mvp/store";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const transaction = store.activateTransaction(id);
    await createTransactionEvent({
      tradeId: id,
      actorUserId: typeof body?.actorUserId === "string" ? body.actorUserId : null,
      eventType: "TRADE_ACTIVATED",
      payload: { source: "ENGINE" },
    });
    return NextResponse.json({ ok: true, data: transaction });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  }
}
