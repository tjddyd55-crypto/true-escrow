import crypto from "crypto";

export type InMemoryQuestionRow = {
  id: string;
  block_id: string;
  order_index: number;
  type: string;
  label: string | null;
  description: string | null;
  required: boolean;
  allow_attachment: boolean;
  options: unknown;
  created_at: string;
};

const questionsById = new Map<string, InMemoryQuestionRow>();

function listByBlockInternal(blockId: string): InMemoryQuestionRow[] {
  return [...questionsById.values()]
    .filter((q) => q.block_id === blockId)
    .sort((a, b) => a.order_index - b.order_index);
}

function normalizeOrderIndexes(blockId: string): void {
  const list = listByBlockInternal(blockId);
  list.forEach((q, idx) => {
    q.order_index = idx;
    questionsById.set(q.id, q);
  });
}

export function listQuestions(blockId: string): InMemoryQuestionRow[] {
  return listByBlockInternal(blockId);
}

export function createQuestion(input: {
  blockId: string;
  type: string;
  label: string;
  description: string | null;
  required: boolean;
  allowAttachment: boolean;
  options: unknown;
}): InMemoryQuestionRow {
  const orderIndex = listByBlockInternal(input.blockId).length;
  const created: InMemoryQuestionRow = {
    id: crypto.randomUUID(),
    block_id: input.blockId,
    order_index: orderIndex,
    type: input.type,
    label: input.label,
    description: input.description,
    required: input.required,
    allow_attachment: input.allowAttachment,
    options: input.options,
    created_at: new Date().toISOString(),
  };
  questionsById.set(created.id, created);
  return created;
}

export function getQuestion(questionId: string): InMemoryQuestionRow | null {
  return questionsById.get(questionId) ?? null;
}

export function updateQuestion(
  questionId: string,
  patch: Partial<Pick<InMemoryQuestionRow, "type" | "label" | "description" | "required" | "allow_attachment" | "options">>
): InMemoryQuestionRow | null {
  const existing = questionsById.get(questionId);
  if (!existing) return null;

  const next: InMemoryQuestionRow = { ...existing, ...patch };
  questionsById.set(questionId, next);
  return next;
}

export function deleteQuestion(questionId: string): { deleted: boolean; blockId?: string } {
  const existing = questionsById.get(questionId);
  if (!existing) return { deleted: false };
  questionsById.delete(questionId);
  normalizeOrderIndexes(existing.block_id);
  return { deleted: true, blockId: existing.block_id };
}

export function reorderQuestions(blockId: string, orderedQuestionIds: string[]): Record<string, number> {
  const current = listByBlockInternal(blockId);
  const existingIds = new Set(current.map((q) => q.id));
  const uniqueOrdered = [...new Set(orderedQuestionIds)].filter((id) => existingIds.has(id));

  const untouchedIds = current
    .map((q) => q.id)
    .filter((id) => !uniqueOrdered.includes(id));
  const finalOrder = [...uniqueOrdered, ...untouchedIds];

  const orderIndexByQuestionId: Record<string, number> = {};
  finalOrder.forEach((id, idx) => {
    const q = questionsById.get(id);
    if (!q) return;
    q.order_index = idx;
    questionsById.set(id, q);
    orderIndexByQuestionId[id] = idx;
  });
  return orderIndexByQuestionId;
}
