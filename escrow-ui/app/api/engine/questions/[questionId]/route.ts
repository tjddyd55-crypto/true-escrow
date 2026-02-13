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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ questionId: string }> }
) {
  try {
    const { questionId } = await params;
    if (!questionId) {
      return NextResponse.json({ ok: false, error: "questionId required" }, { status: 400 });
    }
    const body = (await request.json()) as Record<string, unknown>;
    const updates: string[] = [];
    const values: unknown[] = [];
    let i = 1;
    if (body.type !== undefined) {
      updates.push(`type = $${i++}`);
      values.push(body.type);
    }
    if (body.label !== undefined) {
      updates.push(`label = $${i++}`);
      values.push(body.label);
    }
    if (body.description !== undefined) {
      updates.push(`description = $${i++}`);
      values.push(body.description);
    }
    if (body.required !== undefined) {
      updates.push(`required = $${i++}`);
      values.push(Boolean(body.required));
    }
    if (body.options !== undefined) {
      updates.push(`options = $${i++}`);
      values.push(JSON.stringify(body.options));
    }
    if (updates.length === 0) {
      const { rows } = await query<QuestionRow>(
        "SELECT id, block_id, order_index, type, label, description, required, options, created_at FROM escrow_block_questions WHERE id = $1",
        [questionId]
      );
      if (rows.length === 0) {
        return NextResponse.json({ ok: false, error: "Question not found" }, { status: 404 });
      }
      return NextResponse.json({ ok: true, data: rows[0] });
    }
    values.push(questionId);
    const { rows } = await query<QuestionRow>(
      `UPDATE escrow_block_questions SET ${updates.join(", ")} WHERE id = $${i} RETURNING id, block_id, order_index, type, label, description, required, options, created_at`,
      values
    );
    if (rows.length === 0) {
      return NextResponse.json({ ok: false, error: "Question not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, data: rows[0] });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Failed to update question";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ questionId: string }> }
) {
  try {
    const { questionId } = await params;
    if (!questionId) {
      return NextResponse.json({ ok: false, error: "questionId required" }, { status: 400 });
    }
    const { rows } = await query(
      "DELETE FROM escrow_block_questions WHERE id = $1 RETURNING id",
      [questionId]
    );
    if (rows.length === 0) {
      return NextResponse.json({ ok: false, error: "Question not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Failed to delete question";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
