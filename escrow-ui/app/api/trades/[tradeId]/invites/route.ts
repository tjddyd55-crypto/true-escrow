import { NextRequest, NextResponse } from "next/server";
import { createInvite } from "@/lib/trade-mvp/store";
import { getSessionUserId } from "@/lib/trade-mvp/session";
import type { InviteType, MvpRole } from "@/lib/trade-mvp/types";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tradeId: string }> }
) {
  try {
    const userId = await getSessionUserId();
    if (!userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const { tradeId } = await params;
    const body = (await request.json()) as { inviteType?: InviteType; inviteTarget?: string; role?: MvpRole };
    if (!body.inviteType || !body.inviteTarget?.trim() || !body.role) {
      return NextResponse.json(
        { ok: false, error: "inviteType, inviteTarget, role are required" },
        { status: 400 }
      );
    }
    const invite = await createInvite({
      tradeId,
      actorUserId: userId,
      inviteType: body.inviteType,
      inviteTarget: body.inviteTarget.trim(),
      role: body.role,
    });
    const url = `${request.nextUrl.origin}/invites/${invite.token}`;
    console.log(`[INVITE_STUB] ${url}`);
    return NextResponse.json({ ok: true, data: { invite, inviteUrl: url } });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Failed to create invite";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
