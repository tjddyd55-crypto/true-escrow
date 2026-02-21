import { NextResponse } from "next/server";
import { acceptInvite } from "@/lib/trade-mvp/store";
import { getSessionUserId } from "@/lib/trade-mvp/session";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const userId = await getSessionUserId();
    if (!userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const { token } = await params;
    const result = await acceptInvite(token, userId);
    return NextResponse.json({ ok: true, data: result });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Failed to accept invite";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
