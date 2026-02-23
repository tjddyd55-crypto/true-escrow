import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/trade-mvp/session";
import { submitCondition } from "@/lib/trade-mvp/store";
import { persistConditionAnswer, resolveTransactionKind } from "@/lib/trade-mvp/conditionAnswer.adapter";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ tradeId: string; blockId: string; conditionId: string }> }
) {
  try {
    const userId = await getSessionUserId();
    if (!userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const body = (await request.json().catch(() => ({}))) as {
      answer?: unknown;
      actorRole?: string;
    };
    const { tradeId, blockId, conditionId } = await params;
    const kind = await resolveTransactionKind({ tradeId, userId });
    if (!kind) return NextResponse.json({ ok: false, error: "Trade not found" }, { status: 404 });

    const result =
      kind === "MVP"
        ? await submitCondition({
            tradeId,
            blockId,
            conditionId,
            actorUserId: userId,
            answer: body.answer,
            isResubmit: true,
          })
        : {
            id: conditionId,
            status: "SUBMITTED" as const,
            answer: await persistConditionAnswer({
              kind,
              tradeId,
              blockId,
              conditionId,
              actorRole: body.actorRole ?? "BUYER",
              answer: body.answer,
            }),
          };
    return NextResponse.json({ ok: true, data: result });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Failed to resubmit condition";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
