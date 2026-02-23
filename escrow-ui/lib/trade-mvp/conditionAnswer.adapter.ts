import { isDatabaseConfigured, query } from "@/lib/db";
import * as engineStore from "@/lib/transaction-engine/store";
import * as inMemoryAnswerStore from "@/lib/block-questions/inMemoryAnswerStore";
import { getTradeDetail } from "./store";

export type TransactionKind = "MVP" | "ENGINE";

export type ConditionAnswer = {
  text: string;
  attachments: string[];
};

export function normalizeConditionAnswer(input: unknown): ConditionAnswer {
  const source = input && typeof input === "object" ? (input as Record<string, unknown>) : {};
  const text = typeof source.text === "string" ? source.text : "";
  const attachments = Array.isArray(source.attachments)
    ? source.attachments.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];
  return { text, attachments };
}

export async function resolveTransactionKind(params: {
  tradeId: string;
  userId: string;
}): Promise<TransactionKind | null> {
  const mvp = await getTradeDetail(params.tradeId, params.userId);
  if (mvp) return "MVP";
  return engineStore.getTransaction(params.tradeId) ? "ENGINE" : null;
}

export async function persistConditionAnswer(params: {
  kind: TransactionKind;
  tradeId: string;
  blockId: string;
  conditionId: string;
  actorRole: string;
  answer: unknown;
}) {
  const normalized = normalizeConditionAnswer(params.answer);
  if (params.kind !== "ENGINE") {
    return normalized;
  }

  if (!isDatabaseConfigured()) {
    inMemoryAnswerStore.upsertAnswer({
      trade_id: params.tradeId,
      block_id: params.blockId,
      question_id: params.conditionId,
      actor_role: params.actorRole,
      answer: normalized,
    });
    return normalized;
  }

  await query(
    `INSERT INTO escrow_block_answers (trade_id, block_id, question_id, actor_role, answer)
     VALUES ($1, $2, $3, $4, $5::jsonb)
     ON CONFLICT (trade_id, block_id, question_id, actor_role)
     DO UPDATE SET answer = EXCLUDED.answer`,
    [params.tradeId, params.blockId, params.conditionId, params.actorRole, JSON.stringify(normalized)]
  );
  return normalized;
}
