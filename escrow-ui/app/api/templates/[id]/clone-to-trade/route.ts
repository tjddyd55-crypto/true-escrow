import { NextRequest, NextResponse } from "next/server";
import * as store from "@/lib/transaction-engine/store";
import { isDatabaseConfigured, query } from "@/lib/db";
import { addDays } from "@/lib/transaction-engine/dateUtils";
import { getOrCreateOwnerKey, applyOwnerCookie } from "@/lib/templates/ownerKey";
import * as inMemoryUserTemplates from "@/lib/templates/inMemoryUserTemplates";
import * as inMemoryQuestionStore from "@/lib/block-questions/inMemoryQuestionStore";
import { allocateDatesByDurations, type TradeTemplateJson } from "@/lib/templates/templateSnapshot";

type CloneBody = {
  title?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  parties?: { buyerId?: string; sellerId?: string };
};

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = (await request.json()) as CloneBody;
    const { ownerKey, shouldSetCookie } = await getOrCreateOwnerKey();

    let templateRow: { title: string; description: string | null; template_json: TradeTemplateJson } | null = null;
    if (isDatabaseConfigured()) {
      templateRow =
        (
          await query<{ title: string; description: string | null; template_json: TradeTemplateJson }>(
            `SELECT title, description, template_json
             FROM escrow_user_templates
             WHERE id = $1 AND owner_user_id = $2`,
            [id, ownerKey]
          )
        ).rows[0] ?? null;
    } else {
      const inMemory = inMemoryUserTemplates.getUserTemplate(id);
      if (inMemory?.owner_user_id === ownerKey) {
        templateRow = {
          title: inMemory.title,
          description: inMemory.description,
          template_json: inMemory.template_json as unknown as TradeTemplateJson,
        };
      }
    }
    if (!templateRow) return NextResponse.json({ ok: false, error: "Template not found" }, { status: 404 });

    const templateJson = templateRow.template_json;
    if (!templateJson?.blocks?.length) {
      return NextResponse.json({ ok: false, error: "Template blocks are empty" }, { status: 400 });
    }

    const startDate = body.startDate ?? new Date().toISOString().slice(0, 10);
    const endDate = body.endDate ?? addDays(startDate, 30);
    if (startDate > endDate) {
      return NextResponse.json({ ok: false, error: "startDate must be before or equal to endDate" }, { status: 400 });
    }

    const tx = store.createTransaction({
      title: body.title?.trim() || `${templateRow.title} copy`,
      description: body.description?.trim() || templateRow.description || undefined,
      initiatorId: body.parties?.buyerId || "00000000-0000-0000-0000-000000000001",
      initiatorRole: "BUYER",
      buyerId: body.parties?.buyerId || "00000000-0000-0000-0000-000000000001",
      sellerId: body.parties?.sellerId || "00000000-0000-0000-0000-000000000002",
      startDate,
      endDate,
    });
    store.saveTransactionGraph({
      transaction: tx,
      blocks: [],
      approvalPolicies: [],
      blockApprovers: [],
      workRules: [],
      workItems: [],
    });

    const sortedBlocks = [...templateJson.blocks].sort((a, b) => a.orderIndex - b.orderIndex);
    const ranges = allocateDatesByDurations({
      startDate,
      endDate,
      durations: sortedBlocks.map((b) => b.durationDays),
    });

    const createdBlocks: Array<{ id: string; questions: TradeTemplateJson["blocks"][number]["questions"] }> = [];
    for (let i = 0; i < sortedBlocks.length; i++) {
      const srcBlock = sortedBlocks[i];
      const range = ranges[i];
      const policy = store.createApprovalPolicy({
        type: (srcBlock.approvalPolicyType as any) ?? "SINGLE",
        threshold: srcBlock.approvalThreshold ?? undefined,
      });
      const block = store.addBlock(tx.id, {
        title: srcBlock.title,
        startDate: range.startDate,
        endDate: range.endDate,
        orderIndex: i,
        approvalPolicyId: policy.id,
      });
      const approvers = srcBlock.approvers?.length
        ? srcBlock.approvers
        : [{ role: "BUYER", required: true }];
      approvers.forEach((a) => {
        store.addBlockApprover({
          blockId: block.id,
          role: (a.role as any) ?? "BUYER",
          userId: a.userId,
          required: a.required ?? true,
        });
      });
      store.addWorkRule(block.id, {
        workType: "CUSTOM",
        title: srcBlock.title,
        quantity: 1,
        frequency: "ONCE",
        dueDates: [],
      });
      createdBlocks.push({ id: block.id, questions: srcBlock.questions ?? [] });
    }

    for (const block of createdBlocks) {
      const questions = block.questions;
      if (isDatabaseConfigured()) {
        for (let i = 0; i < questions.length; i++) {
          const q = questions[i];
          await query(
            `INSERT INTO escrow_block_questions
             (block_id, order_index, type, label, description, required, allow_attachment, options)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [block.id, i, q.type, q.label || "Untitled question", q.description, Boolean(q.required), Boolean(q.allowAttachment), q.options ?? {}]
          );
        }
      } else {
        questions.forEach((q) => {
          inMemoryQuestionStore.createQuestion({
            blockId: block.id,
            type: q.type,
            label: q.label || "Untitled question",
            description: q.description ?? null,
            required: Boolean(q.required),
            allowAttachment: Boolean(q.allowAttachment),
            options: q.options ?? {},
          });
        });
      }
    }

    const res = NextResponse.json({ ok: true, data: { tradeId: tx.id } });
    return shouldSetCookie ? applyOwnerCookie(res, ownerKey) : res;
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Failed to clone template";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
