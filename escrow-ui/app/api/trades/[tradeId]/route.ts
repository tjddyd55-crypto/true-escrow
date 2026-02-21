import { NextResponse } from "next/server";
import { getTradeDetail } from "@/lib/trade-mvp/store";
import { getSessionUserId } from "@/lib/trade-mvp/session";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ tradeId: string }> }
) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  const { tradeId } = await params;
  const detail = await getTradeDetail(tradeId, userId);
  if (!detail) return NextResponse.json({ ok: false, error: "Trade not found" }, { status: 404 });
  return NextResponse.json({ ok: true, data: detail });
}
