import { NextRequest, NextResponse } from "next/server";
import { createTrade, listMyTrades } from "@/lib/trade-mvp/store";
import { getSessionUserId } from "@/lib/trade-mvp/session";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  const trades = await listMyTrades(userId);
  return NextResponse.json({ ok: true, data: trades });
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getSessionUserId();
    if (!userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const body = (await request.json()) as { title?: string; description?: string };
    const title = body.title?.trim() ?? "";
    if (!title) return NextResponse.json({ ok: false, error: "title is required" }, { status: 400 });
    const trade = await createTrade({ title, description: body.description, createdBy: userId });
    return NextResponse.json({ ok: true, data: trade });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Failed to create trade";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
