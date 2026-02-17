import { NextRequest, NextResponse } from "next/server";
import * as store from "@/lib/transaction-engine/store";
import { isDatabaseConfigured, query } from "@/lib/db";
import { getOrCreateOwnerKey, applyOwnerCookie } from "@/lib/templates/ownerKey";
import * as inMemoryQuestionStore from "@/lib/block-questions/inMemoryQuestionStore";
import * as inMemoryUserTemplates from "@/lib/templates/inMemoryUserTemplates";
import { buildTemplateSnapshot, type SnapshotQuestion } from "@/lib/templates/templateSnapshot";

type QuestionRow = {
  block_id: string;
  type: string;
  label: string | null;
  description: string | null;
  required: boolean;
  options: unknown;
  order_index: number;
};

export async function GET() {
  try {
    const { ownerKey, shouldSetCookie } = await getOrCreateOwnerKey();
    let rows: Array<{
      id: string;
      title: string;
      description: string | null;
      source_trade_id: string | null;
      template_json: Record<string, unknown>;
      created_at: string;
      updated_at: string;
    }> = [];

    if (isDatabaseConfigured()) {
      rows = (
        await query<{
          id: string;
          title: string;
          description: string | null;
          source_trade_id: string | null;
          template_json: Record<string, unknown>;
          created_at: string;
          updated_at: string;
        }>(
          `SELECT id, title, description, source_trade_id, template_json, created_at, updated_at
           FROM escrow_user_templates
           WHERE owner_user_id = $1
           ORDER BY created_at DESC`,
          [ownerKey]
        )
      ).rows;
    } else {
      rows = inMemoryUserTemplates.listUserTemplates(ownerKey);
    }

    const res = NextResponse.json({ ok: true, data: rows });
    return shouldSetCookie ? applyOwnerCookie(res, ownerKey) : res;
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Failed to load templates";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      tradeId?: string;
      title?: string;
      description?: string;
    };
    if (!body.tradeId || !body.title?.trim()) {
      return NextResponse.json({ ok: false, error: "tradeId and title are required" }, { status: 400 });
    }

    const tx = store.getTransaction(body.tradeId);
    if (!tx) return NextResponse.json({ ok: false, error: "Trade not found" }, { status: 404 });
    const blocks = store.getBlocks(body.tradeId);
    if (blocks.length === 0) {
      return NextResponse.json({ ok: false, error: "Cannot save empty trade as template" }, { status: 400 });
    }

    const graph = {
      transaction: tx,
      blocks,
      approvalPolicies: blocks.map((b) => store.getApprovalPolicy(b.approvalPolicyId)).filter(Boolean) as any[],
      blockApprovers: blocks.flatMap((b) => store.getBlockApprovers(b.id)),
      workRules: blocks.flatMap((b) => store.getWorkRules(b.id)),
      workItems: blocks.flatMap((b) => store.getWorkItemsByBlock(b.id)),
    };

    const questionsByBlockId: Record<string, SnapshotQuestion[]> = {};
    if (isDatabaseConfigured()) {
      const questionRows = (
        await query<QuestionRow>(
          `SELECT block_id, type, label, description, required, options, order_index
           FROM escrow_block_questions
           WHERE block_id = ANY($1::uuid[])
           ORDER BY block_id ASC, order_index ASC`,
          [blocks.map((b) => b.id)]
        )
      ).rows;
      questionRows.forEach((q) => {
        if (!questionsByBlockId[q.block_id]) questionsByBlockId[q.block_id] = [];
        questionsByBlockId[q.block_id].push({
          type: q.type,
          label: q.label || "Untitled question",
          description: q.description,
          required: q.required,
          options: q.options,
        });
      });
    } else {
      blocks.forEach((b) => {
        questionsByBlockId[b.id] = inMemoryQuestionStore.listQuestions(b.id).map((q) => ({
          type: q.type,
          label: q.label || "Untitled question",
          description: q.description,
          required: q.required,
          options: q.options,
        }));
      });
    }

    const templateJson = buildTemplateSnapshot({ graph, questionsByBlockId });
    const { ownerKey, shouldSetCookie } = await getOrCreateOwnerKey();

    let created: Record<string, unknown>;
    if (isDatabaseConfigured()) {
      created = (
        await query<{ id: string; title: string; description: string | null; source_trade_id: string | null }>(
          `INSERT INTO escrow_user_templates (owner_user_id, title, description, source_trade_id, template_json)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING id, title, description, source_trade_id`,
          [ownerKey, body.title.trim(), body.description?.trim() || null, body.tradeId, templateJson]
        )
      ).rows[0] as Record<string, unknown>;
    } else {
      created = inMemoryUserTemplates.createUserTemplate({
        ownerUserId: ownerKey,
        title: body.title.trim(),
        description: body.description?.trim(),
        sourceTradeId: body.tradeId,
        templateJson,
      });
    }

    const res = NextResponse.json({ ok: true, data: created });
    return shouldSetCookie ? applyOwnerCookie(res, ownerKey) : res;
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Failed to save template";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
