import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/trade-mvp/session";
import { markNotificationsRead } from "@/lib/trade-mvp/store";

export async function POST(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const ids = Array.isArray(body?.ids)
    ? body.ids.filter((id: unknown): id is string => typeof id === "string" && id.length > 0)
    : undefined;

  await markNotificationsRead(userId, ids);
  return NextResponse.json({ ok: true });
}
