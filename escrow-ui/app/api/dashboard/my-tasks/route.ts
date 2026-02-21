import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/trade-mvp/session";
import { listMyTasks } from "@/lib/trade-mvp/store";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  const data = await listMyTasks(userId);
  return NextResponse.json({ ok: true, data });
}
