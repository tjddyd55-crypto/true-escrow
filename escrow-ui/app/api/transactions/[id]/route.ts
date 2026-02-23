import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/trade-mvp/session";
import { getTradeDetail } from "@/lib/trade-mvp/store";
import * as engineStore from "@/lib/transaction-engine/store";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const mvpDetail = await getTradeDetail(id, userId);
  if (mvpDetail) {
    return NextResponse.json({ ok: true, data: { kind: "MVP", id } });
  }

  const engineTransaction = engineStore.getTransaction(id);
  if (engineTransaction) {
    return NextResponse.json({ ok: true, data: { kind: "ENGINE", id } });
  }

  return NextResponse.json({ ok: false, error: "Transaction not found" }, { status: 404 });
}
