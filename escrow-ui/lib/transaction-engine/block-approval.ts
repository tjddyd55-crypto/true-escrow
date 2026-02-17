import { isDatabaseConfigured, query } from "@/lib/db";
import { computeBlockReadiness, type MissingRequired, type ReadinessQuestion } from "@/lib/block-questions/readiness";
import * as inMemoryQuestionStore from "@/lib/block-questions/inMemoryQuestionStore";
import * as inMemoryAnswerStore from "@/lib/block-questions/inMemoryAnswerStore";
import * as store from "@/lib/transaction-engine/store";

export async function canApproveBlock(params: {
  tradeId: string;
  blockId: string;
}): Promise<{ canApprove: boolean; missingRequired: MissingRequired[]; reason?: string }> {
  const { tradeId, blockId } = params;
  const tx = store.getTransaction(tradeId);
  if (!tx) return { canApprove: false, missingRequired: [], reason: "Trade not found" };
  const block = store.getBlockById(blockId);
  if (!block || block.transactionId !== tradeId) {
    return { canApprove: false, missingRequired: [], reason: "Block does not belong to this trade" };
  }

  const questions: ReadinessQuestion[] = isDatabaseConfigured()
    ? (
        await query<ReadinessQuestion>(
          `SELECT id, type, required, COALESCE(allow_attachment, false) AS allow_attachment, options
           FROM escrow_block_questions
           WHERE block_id = $1
           ORDER BY order_index ASC`,
          [blockId]
        )
      ).rows
    : inMemoryQuestionStore.listQuestions(blockId).map((q) => ({
        id: q.id,
        type: q.type,
        required: q.required,
        allow_attachment: Boolean(q.allow_attachment),
        options: q.options,
      }));

  const readiness = await computeBlockReadiness({
    questions,
    getAnswer: async (questionId) => {
      if (!isDatabaseConfigured()) {
        return inMemoryAnswerStore.latestAnswer(tradeId, blockId, questionId)?.answer ?? null;
      }
      const result = await query<{ answer: unknown }>(
        `SELECT answer
         FROM escrow_block_answers
         WHERE trade_id = $1 AND block_id = $2 AND question_id = $3
         ORDER BY created_at DESC
         LIMIT 1`,
        [tradeId, blockId, questionId]
      );
      return result.rows[0]?.answer ?? null;
    },
    hasAttachment: async (questionId) => {
      if (!isDatabaseConfigured()) {
        return inMemoryAnswerStore.hasAttachmentForRequiredFile(tradeId, blockId, questionId);
      }
      const result = await query<{ c: string }>(
        `SELECT count(*)::text AS c
         FROM escrow_block_attachments
         WHERE trade_id = $1
           AND block_id = $2
           AND (question_id = $3 OR question_id IS NULL)`,
        [tradeId, blockId, questionId]
      );
      return Number(result.rows[0]?.c ?? "0") > 0;
    },
  });

  if (readiness.ready) return { canApprove: true, missingRequired: [] };
  return {
    canApprove: false,
    missingRequired: readiness.missingRequired,
    reason: readiness.missingRequired[0]?.reason ?? "Required questions are not satisfied",
  };
}
