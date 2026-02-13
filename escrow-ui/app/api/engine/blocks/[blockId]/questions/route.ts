import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

type QuestionRow = {
  id: string;
  block_id: string;
  order_index: number;
  type: string;
  label: string | null;
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
      return NextResponse.json({ ok: false, error: "blockId required" }, { status: 400 });
    }
    const { rows } = await query<QuestionRow>(
      "SELECT id, block_id, order_index, type, label, description, required, options, created_at FROM escrow_block_questions WHERE block_id = $1 ORDER BY order_index ASC",
      [blockId]
    );
    return NextResponse.json({ ok: true, data: rows });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Failed to list questions";
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
      return NextResponse.json({ ok: false, error: "blockId required" }, { status: 400 });
    }
    const body = (await request.json()) as Record<string, unknown>;
    const type = (body.type as string) ?? "SHORT_TEXT";
    const label = (body.label as string) ?? null;
    const description = (body.description as string) ?? null;
    const required = Boolean(body.required);
    const options = body.options ?? null;

    const { rows: maxRows } = await query<{ m: number }>(
      "SELECT COALESCE(MAX(order_index), 0)::int AS m FROM escrow_block_questions WHERE block_id = $1",
      [blockId]
    );
    const orderIndex = (maxRows[0]?.m ?? 0) + 1;

    const { rows: inserted } = await query<QuestionRow>(
      `INSERT INTO escrow_block_questions (block_id, order_index, type, label, description, required, options)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, block_id, order_index, type, label, description, required, options, created_at`,
      [blockId, orderIndex, type, label, description, required, options ? JSON.stringify(options) : null]
    );
    return NextResponse.json({ ok: true, data: inserted[0] });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Failed to create question";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
