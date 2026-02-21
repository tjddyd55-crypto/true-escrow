import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/trade-mvp/session";
import { submitCondition } from "@/lib/trade-mvp/store";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ tradeId: string; blockId: string; conditionId: string }> }
) {
  try {
    const userId = await getSessionUserId();
    if (!userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const { tradeId, blockId, conditionId } = await params;
    const result = await submitCondition({
      tradeId,
      blockId,
      conditionId,
      actorUserId: userId,
      isResubmit: true,
    });
    return NextResponse.json({ ok: true, data: result });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Failed to resubmit condition";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
