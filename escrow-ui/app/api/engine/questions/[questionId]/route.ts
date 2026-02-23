import { NextRequest, NextResponse } from "next/server";
import { isDatabaseConfigured, query } from "@/lib/db";
import * as inMemoryQuestionStore from "@/lib/block-questions/inMemoryQuestionStore";

const ALLOWED_TYPES = new Set(["LONG_TEXT", "FILE_UPLOAD"]);

type QuestionRow = {
  id: string;
  block_id: string;
  order_index: number;
  type: string;
  label: string | null;
  description: string | null;
  required: boolean;
  allow_attachment?: boolean;
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

    if (!isDatabaseConfigured()) {
      const existing = inMemoryQuestionStore.getQuestion(questionId);
      if (!existing) {
        return NextResponse.json({ ok: false, error: "Question not found" }, { status: 404 });
      }
      const normalizedType =
        typeof body.type === "string" && ALLOWED_TYPES.has(body.type)
          ? body.type
          : undefined;
      const effectiveAllowAttachment =
        normalizedType === "FILE_UPLOAD"
          ? true
          : body.allowAttachment !== undefined || body.allow_attachment !== undefined
            ? Boolean(body.allowAttachment ?? body.allow_attachment)
            : undefined;
      const updated = inMemoryQuestionStore.updateQuestion(questionId, {
        type: normalizedType as string | undefined,
        label: body.label as string | null | undefined,
        description: body.description as string | null | undefined,
        required: body.required !== undefined ? Boolean(body.required) : undefined,
        allow_attachment: effectiveAllowAttachment,
        options: body.options !== undefined ? {} : undefined,
      });
      return NextResponse.json({
        ok: true,
        data: updated
          ? {
              ...updated,
              allowAttachment: Boolean(updated.allow_attachment),
              allow_attachment: Boolean(updated.allow_attachment),
            }
          : updated,
      });
    }

    const updates: string[] = [];
    const values: unknown[] = [];
    let i = 1;
    if (body.type !== undefined) {
      if (typeof body.type !== "string" || !ALLOWED_TYPES.has(body.type)) {
        return NextResponse.json({ ok: false, error: "Unsupported question type" }, { status: 400 });
      }
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
    if (body.allowAttachment !== undefined || body.allow_attachment !== undefined) {
      updates.push(`allow_attachment = $${i++}`);
      values.push(Boolean(body.allowAttachment ?? body.allow_attachment));
    }
    if (body.type === "FILE_UPLOAD" && body.allowAttachment === undefined && body.allow_attachment === undefined) {
      updates.push(`allow_attachment = $${i++}`);
      values.push(true);
    }
    if (body.options !== undefined) {
      updates.push(`options = $${i++}`);
      values.push({});
    }
    if (updates.length === 0) {
      const { rows } = await query<QuestionRow>(
        "SELECT id, block_id, order_index, type, label, description, required, COALESCE(allow_attachment, false) AS allow_attachment, options, created_at FROM escrow_block_questions WHERE id = $1",
        [questionId]
      );
      if (rows.length === 0) {
        return NextResponse.json({ ok: false, error: "Question not found" }, { status: 404 });
      }
      return NextResponse.json({
        ok: true,
        data: {
          ...rows[0],
          allowAttachment: Boolean(rows[0].allow_attachment),
          allow_attachment: Boolean(rows[0].allow_attachment),
        },
      });
    }
    values.push(questionId);
    const { rows } = await query<QuestionRow>(
      `UPDATE escrow_block_questions SET ${updates.join(", ")} WHERE id = $${i} RETURNING id, block_id, order_index, type, label, description, required, COALESCE(allow_attachment, false) AS allow_attachment, options, created_at`,
      values
    );
    if (rows.length === 0) {
      return NextResponse.json({ ok: false, error: "Question not found" }, { status: 404 });
    }
    return NextResponse.json({
      ok: true,
      data: {
        ...rows[0],
        allowAttachment: Boolean(rows[0].allow_attachment),
        allow_attachment: Boolean(rows[0].allow_attachment),
      },
    });
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

    if (!isDatabaseConfigured()) {
      const deleted = inMemoryQuestionStore.deleteQuestion(questionId);
      if (!deleted.deleted) {
        return NextResponse.json({ ok: false, error: "Question not found" }, { status: 404 });
      }
      return NextResponse.json({ ok: true });
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
