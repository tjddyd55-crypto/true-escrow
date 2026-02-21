import { NextRequest, NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/trade-mvp/session";
import { rejectConditionWithExtension } from "@/lib/trade-mvp/store";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tradeId: string; blockId: string; conditionId: string }> }
) {
  try {
    const userId = await getSessionUserId();
    if (!userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const body = (await request.json()) as { rejectReason?: string; newDueDate?: string };
    const { tradeId, blockId, conditionId } = await params;
    const result = await rejectConditionWithExtension({
      tradeId,
      blockId,
      conditionId,
      actorUserId: userId,
      rejectReason: body.rejectReason ?? "",
      newDueDate: body.newDueDate ?? "",
    });
    return NextResponse.json({ ok: true, data: result });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Failed to reject condition";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
