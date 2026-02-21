import { NextResponse } from "next/server";
import { getInviteByToken } from "@/lib/trade-mvp/store";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const info = await getInviteByToken(token);
  if (!info) return NextResponse.json({ ok: false, error: "Invite not found" }, { status: 404 });
  return NextResponse.json({ ok: true, data: info });
}
