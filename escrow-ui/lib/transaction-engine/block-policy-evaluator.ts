import { isDatabaseConfigured, query } from "@/lib/db";
import * as inMemoryQuestionStore from "@/lib/block-questions/inMemoryQuestionStore";
import { canApproveBlock } from "./block-approval";
import { evaluateBlockTransition, isAutoEligible, isFormallyCompleted } from "./block-policy";
import * as store from "./store";

async function hasAttachmentQuestion(blockId: string): Promise<boolean> {
  if (!isDatabaseConfigured()) {
    return inMemoryQuestionStore.listQuestions(blockId).some((q) => Boolean(q.allow_attachment));
  }
  const result = await query<{ c: string }>(
    `SELECT count(*)::text AS c
     FROM escrow_block_questions
     WHERE block_id = $1
       AND COALESCE(allow_attachment, false) = true`,
    [blockId]
  );
  return Number(result.rows[0]?.c ?? "0") > 0;
}

export async function evaluateAndApplyBlockPolicy(params: {
  tradeId: string;
  blockId: string;
  now?: Date;
}): Promise<{ changed: boolean; status: string; reason?: string; autoEligible: boolean; formallyCompleted: boolean }> {
  const block = store.getBlockById(params.blockId);
  if (!block) throw new Error("Block not found");
  const readiness = await canApproveBlock({ tradeId: params.tradeId, blockId: params.blockId });
  const formallyCompleted = isFormallyCompleted({ missingRequiredCount: readiness.missingRequired.length });
  const autoEligible = isAutoEligible({
    approvalMode: block.approvalMode,
    hasAttachmentQuestion: await hasAttachmentQuestion(params.blockId),
  });
  const result = evaluateBlockTransition({
    block,
    now: params.now ?? new Date(),
    formallyCompleted,
    autoEligible,
  });
  if (result.nextStatus !== block.status) {
    store.transitionBlockStatus(params.blockId, result.nextStatus, "ADMIN", result.reason);
    return {
      changed: true,
      status: result.nextStatus,
      reason: result.reason,
      autoEligible,
      formallyCompleted,
    };
  }
  return {
    changed: false,
    status: block.status,
    reason: result.reason,
    autoEligible,
    formallyCompleted,
  };
}
