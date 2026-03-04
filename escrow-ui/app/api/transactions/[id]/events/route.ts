import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/trade-mvp/session";
import { getTradeDetail, listTransactionEvents } from "@/lib/trade-mvp/store";
import * as engineStore from "@/lib/transaction-engine/store";
import * as engineLog from "@/lib/transaction-engine/log";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getSessionUserId();
    if (!userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const { id } = await params;

    const mvpDetail = await getTradeDetail(id, userId);
    if (mvpDetail) {
      const mvpEvents = await listTransactionEvents(id, userId);
      return NextResponse.json({ ok: true, data: { kind: "MVP", events: mvpEvents } });
    }

    const engineTx = engineStore.getTransaction(id);
    if (!engineTx) return NextResponse.json({ ok: false, error: "Transaction not found" }, { status: 404 });
    const logs = engineLog.listLogs(id).map((log) => ({
      id: log.id,
      tradeId: log.transactionId,
      blockId: (log.meta?.blockId as string | undefined) ?? null,
      conditionId: null,
      actorUserId: null,
      eventType: log.action,
      payloadJson: log.meta ?? null,
      createdAt: log.timestamp,
    }));
    return NextResponse.json({ ok: true, data: { kind: "ENGINE", events: logs } });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Failed to load transaction events";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
