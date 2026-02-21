import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/trade-mvp/session";
import { finalApproveBlock } from "@/lib/trade-mvp/store";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ tradeId: string; blockId: string }> }
) {
  try {
    const userId = await getSessionUserId();
    if (!userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const { tradeId, blockId } = await params;
    const block = await finalApproveBlock({ tradeId, blockId, actorUserId: userId });
    return NextResponse.json({ ok: true, data: block });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Failed to final-approve block";
    const status = message.includes("Only final approver role") ? 403 : 400;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
