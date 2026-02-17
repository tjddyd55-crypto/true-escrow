import { NextRequest, NextResponse } from "next/server";
import { isDatabaseConfigured, query } from "@/lib/db";
import * as inMemoryQuestionStore from "@/lib/block-questions/inMemoryQuestionStore";

type QuestionRow = {
  id: string;
  block_id: string;
  order_index: number;
  type: string;
  label: string;
  description: string | null;
  required: boolean;
  options: unknown;
  created_at: string;
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ blockId: string }> }
) {
  try {
    const { blockId } = await params;

    if (!blockId) {
      return NextResponse.json(
        { ok: false, error: "blockId required" },
        { status: 400 }
      );
    }

    const rows = isDatabaseConfigured()
      ? (
          await query<QuestionRow>(
            `
            SELECT id, block_id, order_index, type, label, description, required, options, created_at
            FROM escrow_block_questions
            WHERE block_id = $1
            ORDER BY order_index ASC
            `,
            [blockId]
          )
        ).rows
      : inMemoryQuestionStore.listQuestions(blockId);

    return NextResponse.json({ ok: true, data: rows });
  } catch (e: unknown) {
    const message =
      e instanceof Error ? e.message : "Failed to list questions";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ blockId: string }> }
) {
  try {
    const { blockId } = await params;

    if (!blockId) {
      return NextResponse.json(
        { ok: false, error: "blockId required" },
        { status: 400 }
      );
    }

    const body = await request.json();

    const type = body.type ?? "SHORT_TEXT";
    const rawLabel = body.label;
    const label =
      typeof rawLabel === "string" && rawLabel.trim().length > 0
        ? rawLabel.trim()
        : "Untitled question";
    const description = body.description ?? null;
    const required = Boolean(body.required);
    // Keep jsonb payload valid even when client does not send options.
    const options = body.options ?? [];

    if (!isDatabaseConfigured()) {
      const created = inMemoryQuestionStore.createQuestion({
        blockId,
        type,
        label,
        description,
        required,
        options,
      });
      return NextResponse.json({ ok: true, data: created });
    }

    // Retry once on unique conflicts to avoid transient 500 on rapid clicks.
    for (let attempt = 0; attempt < 2; attempt++) {
      const { rows: maxRows } = await query<{ m: number }>(
        `
        SELECT COALESCE(MAX(order_index), -1)::int AS m
        FROM escrow_block_questions
        WHERE block_id = $1
        `,
        [blockId]
      );

      const orderIndex = (maxRows[0]?.m ?? -1) + 1;
      console.log("Creating question:", {
        blockId,
        orderIndex,
        type,
        label,
        required,
      });

      try {
        const { rows: inserted } = await query<QuestionRow>(
          `
          INSERT INTO escrow_block_questions
          (block_id, order_index, type, label, description, required, options)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING id, block_id, order_index, type, label, description, required, options, created_at
          `,
          [
            blockId,
            orderIndex,
            type,
            label,
            description,
            required,
            options
          ]
        );

        if (!inserted[0]) {
          throw new Error("Question insert returned no rows");
        }
        return NextResponse.json({ ok: true, data: inserted[0] });
      } catch (e: unknown) {
        const maybePg = e as { code?: string };
        if (maybePg.code === "23505" && attempt === 0) {
          continue;
        }
        throw e;
      }
    }

    return NextResponse.json(
      { ok: false, error: "Failed to create question" },
      { status: 500 }
    );
  } catch (e: unknown) {
    console.error("Create question error:", e);
    const message =
      e instanceof Error ? e.message : "Failed to create question";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
