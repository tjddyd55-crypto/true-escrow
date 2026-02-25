import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/trade-mvp/session";
import { getTransactionSummary } from "@/lib/transaction-summary";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getSessionUserId();
    if (!userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    const summary = await getTransactionSummary(id, userId);
    if (!summary) return NextResponse.json({ ok: false, error: "Transaction not found" }, { status: 404 });
    return NextResponse.json({ ok: true, data: summary });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Failed to load transaction summary";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
