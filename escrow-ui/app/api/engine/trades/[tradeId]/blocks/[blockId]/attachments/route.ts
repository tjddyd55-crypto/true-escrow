import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

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
      uploaderRole?: string;
      questionId?: string | null;
      fileName?: string;
      file_name?: string;
      mime?: string;
      size?: number;
    };
    const uploaderRole = (body.uploaderRole as string) ?? "BUYER";
    const questionId = body.questionId ?? null;
    const fileName = body.fileName ?? body.file_name ?? null;
    const mime = body.mime ?? null;
    const size = body.size ?? null;
    const storage_provider = "NONE";
    const object_key = null;

    const { rows } = await query<{ id: string }>(
      `INSERT INTO escrow_block_attachments
       (trade_id, block_id, question_id, uploader_role, storage_provider, object_key, file_name, mime, size, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'PENDING')
       RETURNING id`,
      [tradeId, blockId, questionId, uploaderRole, storage_provider, object_key, fileName, mime, size]
    );
    const data = rows[0] ? { attachmentId: rows[0].id, id: rows[0].id } : { attachmentId: null, id: null };
    return NextResponse.json({ ok: true, data });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Failed to create attachment";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
