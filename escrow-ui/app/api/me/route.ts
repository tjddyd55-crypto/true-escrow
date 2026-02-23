import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/trade-mvp/session";
import { getUserById } from "@/lib/trade-mvp/store";

export const runtime = "nodejs";

export async function GET() {
  try {
    const userId = await getSessionUserId();
    if (!userId) return NextResponse.json({ ok: true, data: null });
    const user = await getUserById(userId);
    return NextResponse.json({ ok: true, data: user });
  } catch (e) {
    console.error("[api/me] failed:", e);
    return NextResponse.json({ ok: true, data: null });
  }
}
