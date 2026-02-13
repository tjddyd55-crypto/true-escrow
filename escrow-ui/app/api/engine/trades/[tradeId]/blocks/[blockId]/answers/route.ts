import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { validateAnswerByType } from "@/lib/block-questions/validateAnswer";

type QuestionRow = { id: string; type: string; required: boolean; options: unknown };

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

    const { rows: questions } = await query<QuestionRow>(
      "SELECT id, type, required, options FROM escrow_block_questions WHERE block_id = $1",
      [blockId]
    );
    const answerByQ = new Map(answers.map((a) => [a.questionId, a.answer]));
    const optionsByQ = new Map(questions.map((q) => [q.id, (q.options as string[]) ?? []]));

    for (const q of questions) {
      if (!q.required) continue;
      const value = answerByQ.get(q.id);
      const opts = optionsByQ.get(q.id);
      const result = validateAnswerByType(q.type, value, opts);
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
      const result = validateAnswerByType(q.type, a.answer, opts);
      if (!result.valid) continue;
      await query(
        `INSERT INTO escrow_block_answers (trade_id, block_id, question_id, actor_role, answer)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (trade_id, block_id, question_id, actor_role)
         DO UPDATE SET answer = EXCLUDED.answer`,
        [tradeId, blockId, a.questionId, actorRole, JSON.stringify(a.answer)]
      );
      saved++;
    }

    return NextResponse.json({ ok: true, data: { saved } });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Failed to save answers";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
