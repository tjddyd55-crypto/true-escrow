import { NextRequest, NextResponse } from "next/server";
import { withTransaction } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      blockId?: string;
      orderedQuestionIds?: string[];
      questionIds?: string[];
    };
    const blockId = body.blockId;
    const orderedQuestionIds = body.orderedQuestionIds ?? body.questionIds;
    if (!blockId || !Array.isArray(orderedQuestionIds)) {
      return NextResponse.json(
        { ok: false, error: "blockId and orderedQuestionIds (array) required" },
        { status: 400 }
      );
    }
    if (orderedQuestionIds.length === 0) {
      return NextResponse.json({ ok: true, data: { blockId, orderIndexByQuestionId: {} } });
    }

    await withTransaction(async (client) => {
      for (let i = 0; i < orderedQuestionIds.length; i++) {
        await client.query(
          "UPDATE escrow_block_questions SET order_index = $1 WHERE id = $2 AND block_id = $3",
          [i, orderedQuestionIds[i], blockId]
        );
      }
    });

    const orderIndexByQuestionId: Record<string, number> = {};
    orderedQuestionIds.forEach((id, idx) => {
      orderIndexByQuestionId[id] = idx;
    });
    return NextResponse.json({ ok: true, data: { blockId, orderIndexByQuestionId } });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Failed to reorder questions";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
