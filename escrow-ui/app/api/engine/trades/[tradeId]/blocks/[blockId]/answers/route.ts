import { NextRequest, NextResponse } from "next/server";
import { isDatabaseConfigured, query } from "@/lib/db";
import { validateAnswerByType } from "@/lib/block-questions/validateAnswer";
import * as store from "@/lib/transaction-engine/store";
import * as inMemoryQuestionStore from "@/lib/block-questions/inMemoryQuestionStore";
import * as inMemoryAnswerStore from "@/lib/block-questions/inMemoryAnswerStore";
import { normalizeQuestionOptions } from "@/lib/block-questions/options";

type QuestionRow = { id: string; type: string; required: boolean; options: unknown; allow_attachment?: boolean };

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tradeId: string; blockId: string }> }
) {
  try {
    const { tradeId, blockId } = await params;
    if (!tradeId || !blockId) {
      return NextResponse.json(
        { ok: false, error: "tradeId and blockId required" },
        { status: 400 }
      );
    }

    const transaction = store.getTransaction(tradeId);
    if (!transaction) {
      return NextResponse.json({ ok: false, error: "Trade not found" }, { status: 404 });
    }
    const blocks = store.getBlocks(tradeId);
    if (!blocks.some((b) => b.id === blockId)) {
      return NextResponse.json(
        { ok: false, error: "Block does not belong to this trade" },
        { status: 400 }
      );
    }

    const body = (await request.json()) as {
      actorRole?: string;
      answers?: Array<{ questionId: string; answer: unknown }>;
    };
    const actorRole = body.actorRole ?? "BUYER";
    const answers = Array.isArray(body.answers) ? body.answers : [];
    if (answers.length === 0) {
      return NextResponse.json(
        { ok: false, error: "answers array required" },
        { status: 400 }
      );
    }

    const questions: QuestionRow[] = isDatabaseConfigured()
      ? (
          await query<QuestionRow>(
            "SELECT id, type, required, options, COALESCE(allow_attachment, false) AS allow_attachment FROM escrow_block_questions WHERE block_id = $1",
            [blockId]
          )
        ).rows
      : inMemoryQuestionStore.listQuestions(blockId).map((q) => ({
          id: q.id,
          type: q.type,
          required: q.required,
          options: q.options,
          allow_attachment: Boolean(q.allow_attachment),
        }));
    const answerByQ = new Map(answers.map((a) => [a.questionId, a.answer]));
    const optionsByQ = new Map(questions.map((q) => [q.id, normalizeQuestionOptions(q.options)]));

    for (const q of questions) {
      if (!q.required) continue;
      const value = answerByQ.get(q.id);
      const opts = optionsByQ.get(q.id);
      const attachmentEnabled = Boolean(q.allow_attachment || q.type === "FILE" || q.type === "FILE_UPLOAD");
      const hasAttachment = attachmentEnabled
        ? isDatabaseConfigured()
          ? Number(
              (
                await query<{ c: string }>(
                  `SELECT count(*)::text AS c
                   FROM escrow_block_attachments
                   WHERE trade_id = $1
                     AND block_id = $2
                     AND (question_id = $3 OR question_id IS NULL)`,
                  [tradeId, blockId, q.id]
                )
              ).rows[0]?.c ?? "0"
            ) > 0
          : inMemoryAnswerStore.hasAttachmentForRequiredFile(tradeId, blockId, q.id)
        : false;
      const result = validateAnswerByType(q.type, value, opts, { hasAttachment });
      if (!result.valid) {
        return NextResponse.json(
          { ok: false, error: result.error ?? `Required question ${q.id} not answered` },
          { status: 400 }
        );
      }
    }

    let saved = 0;
    for (const a of answers) {
      const q = questions.find((x) => x.id === a.questionId);
      if (!q) continue;
      const opts = optionsByQ.get(q.id);
      const attachmentEnabled = Boolean(q.allow_attachment || q.type === "FILE" || q.type === "FILE_UPLOAD");
      const hasAttachment = attachmentEnabled
        ? isDatabaseConfigured()
          ? (
              await query<{ c: string }>(
                `SELECT count(*)::text AS c
                 FROM escrow_block_attachments
                 WHERE trade_id = $1
                   AND block_id = $2
                   AND (question_id = $3 OR question_id IS NULL)`,
                [tradeId, blockId, q.id]
              )
            ).rows[0]?.c !== "0"
          : inMemoryAnswerStore.hasAttachmentForRequiredFile(tradeId, blockId, q.id)
        : false;
      const result = validateAnswerByType(q.type, a.answer, opts, { hasAttachment });
      if (!result.valid) continue;
      if (isDatabaseConfigured()) {
        await query(
          `INSERT INTO escrow_block_answers (trade_id, block_id, question_id, actor_role, answer)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (trade_id, block_id, question_id, actor_role)
           DO UPDATE SET answer = EXCLUDED.answer`,
          [tradeId, blockId, a.questionId, actorRole, JSON.stringify(a.answer)]
        );
      } else {
        inMemoryAnswerStore.upsertAnswer({
          trade_id: tradeId,
          block_id: blockId,
          question_id: a.questionId,
          actor_role: actorRole,
          answer: a.answer,
        });
      }
      saved++;
    }

    return NextResponse.json({ ok: true, data: { saved } });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Failed to save answers";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
