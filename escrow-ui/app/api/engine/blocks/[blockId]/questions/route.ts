import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

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

    const { rows } = await query<QuestionRow>(
      `
      SELECT id, block_id, order_index, type, label, description, required, options, created_at
      FROM escrow_block_questions
      WHERE block_id = $1
      ORDER BY order_index ASC
      `,
      [blockId]
    );

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
    const label = body.label;
    const description = body.description ?? null;
    const required = Boolean(body.required);
    const options = body.options ?? null;

    // 🔥 label is NOT NULL in DB
    if (!label || typeof label !== "string") {
      return NextResponse.json(
        { ok: false, error: "label is required" },
        { status: 400 }
      );
    }

    // Get next order_index
    const { rows: maxRows } = await query<{ m: number }>(
      `
      SELECT COALESCE(MAX(order_index), -1)::int AS m
      FROM escrow_block_questions
      WHERE block_id = $1
      `,
      [blockId]
    );

    const orderIndex = (maxRows[0]?.m ?? -1) + 1;

    // ✅ IMPORTANT: pass options as object (NOT JSON.stringify)
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

    return NextResponse.json({ ok: true, data: inserted[0] });
  } catch (e: unknown) {
    const message =
      e instanceof Error ? e.message : "Failed to create question";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
