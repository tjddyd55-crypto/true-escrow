import { NextRequest, NextResponse } from "next/server";
import { isDatabaseConfigured, query } from "@/lib/db";
import { computeBlockReadiness, type ReadinessQuestion } from "@/lib/block-questions/readiness";
import * as store from "@/lib/transaction-engine/store";
import * as inMemoryQuestionStore from "@/lib/block-questions/inMemoryQuestionStore";
import * as inMemoryAnswerStore from "@/lib/block-questions/inMemoryAnswerStore";
import { evaluateAndApplyBlockPolicy } from "@/lib/transaction-engine/block-policy-evaluator";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ tradeId: string; blockId: string }> }
) {
  try {
    const { tradeId, blockId } = await params;
    if (!tradeId || !blockId) {
      return NextResponse.json({ ok: false, error: "tradeId and blockId required" }, { status: 400 });
    }

    const trade = store.getTransaction(tradeId);
    if (!trade) {
      return NextResponse.json({ ok: false, error: "Trade not found" }, { status: 404 });
    }
    const blocks = store.getBlocks(tradeId);
    if (!blocks.some((b) => b.id === blockId)) {
      return NextResponse.json({ ok: false, error: "Block does not belong to this trade" }, { status: 400 });
    }

    const questions: ReadinessQuestion[] = isDatabaseConfigured()
      ? (
          await query<ReadinessQuestion>(
            `SELECT id, type, required, COALESCE(allow_attachment, false) AS allow_attachment, options
             FROM escrow_block_questions
             WHERE block_id = $1
             ORDER BY order_index ASC`,
            [blockId]
          )
        ).rows
      : inMemoryQuestionStore.listQuestions(blockId).map((q) => ({
          id: q.id,
          type: q.type,
          required: q.required,
          allow_attachment: Boolean(q.allow_attachment),
          options: q.options,
        }));

    const readiness = await computeBlockReadiness({
      questions,
      getAnswer: async (questionId) => {
        if (!isDatabaseConfigured()) {
          return inMemoryAnswerStore.latestAnswer(tradeId, blockId, questionId)?.answer ?? null;
        }
        const result = await query<{ answer: unknown }>(
          `SELECT answer
           FROM escrow_block_answers
           WHERE trade_id = $1 AND block_id = $2 AND question_id = $3
           ORDER BY created_at DESC
           LIMIT 1`,
          [tradeId, blockId, questionId]
        );
        return result.rows[0]?.answer ?? null;
      },
      hasAttachment: async (questionId) => {
        if (!isDatabaseConfigured()) {
          return inMemoryAnswerStore.hasAttachmentForRequiredFile(tradeId, blockId, questionId);
        }
        const result = await query<{ c: string }>(
          `SELECT count(*)::text AS c
           FROM escrow_block_attachments
           WHERE trade_id = $1
             AND block_id = $2
             AND (question_id = $3 OR question_id IS NULL)`,
          [tradeId, blockId, questionId]
        );
        return Number(result.rows[0]?.c ?? "0") > 0;
      },
    });
    const policy = await evaluateAndApplyBlockPolicy({ tradeId, blockId });
    const block = store.getBlockById(blockId);
    return NextResponse.json({
      ok: true,
      data: {
        ...readiness,
        status: block?.status ?? null,
        approvalMode: block?.approvalMode ?? null,
        dueDate: block?.dueDate ?? null,
        policy,
      },
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Failed to check readiness";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
