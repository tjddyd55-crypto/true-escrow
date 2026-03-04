import { NextResponse } from "next/server";
import { isDatabaseConfigured, query } from "@/lib/db";
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
    const dbEvents = isDatabaseConfigured()
      ? (
          await query<{
            id: string;
            trade_id: string;
            block_id: string | null;
            condition_id: string | null;
            actor_user_id: string | null;
            event_type: string;
            payload_json: Record<string, unknown> | null;
            created_at: string;
          }>(
            `SELECT id, trade_id, block_id, condition_id, actor_user_id, event_type, payload_json, created_at
             FROM transaction_events
             WHERE trade_id = $1
             ORDER BY created_at DESC`,
            [id]
          )
        ).rows.map((row) => ({
          id: row.id,
          tradeId: row.trade_id,
          blockId: row.block_id,
          conditionId: row.condition_id,
          actorUserId: row.actor_user_id,
          eventType: row.event_type,
          payloadJson: row.payload_json,
          createdAt: row.created_at,
        }))
      : [];
    const events = [...dbEvents, ...logs].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
    return NextResponse.json({ ok: true, data: { kind: "ENGINE", events } });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Failed to load transaction events";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
