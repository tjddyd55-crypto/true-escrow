import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { blockId?: string; questionIds?: string[] };
    const blockId = body.blockId;
    const questionIds = body.questionIds;
    if (!blockId || !Array.isArray(questionIds)) {
      return NextResponse.json(
        { ok: false, error: "blockId and questionIds (array) required" },
        { status: 400 }
      );
    }
    if (questionIds.length === 0) {
      return NextResponse.json({ ok: true, data: { blockId, orderIndexByQuestionId: {} } });
    }

    const updates = questionIds.map((id, idx) => ({
      id,
      order_index: idx + 1,
    }));

    for (const u of updates) {
      await query(
        "UPDATE escrow_block_questions SET order_index = $1 WHERE id = $2 AND block_id = $3",
        [u.order_index, u.id, blockId]
      );
    }

    const orderIndexByQuestionId: Record<string, number> = {};
    updates.forEach((u) => {
      orderIndexByQuestionId[u.id] = u.order_index;
    });
    return NextResponse.json({ ok: true, data: { blockId, orderIndexByQuestionId } });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Failed to reorder questions";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
