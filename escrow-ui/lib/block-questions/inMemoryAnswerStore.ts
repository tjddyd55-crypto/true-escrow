type InMemoryAnswerRow = {
  trade_id: string;
  block_id: string;
  question_id: string;
  actor_role: string;
  answer: unknown;
};

type InMemoryAttachmentRow = {
  id: string;
  trade_id: string;
  block_id: string;
  question_id: string | null;
  uploader_role: string;
  file_name: string | null;
  mime: string | null;
  size: number | null;
  status: string;
};

const answers = new Map<string, InMemoryAnswerRow>();
const attachments = new Map<string, InMemoryAttachmentRow>();

function answerKey(tradeId: string, blockId: string, questionId: string, actorRole: string): string {
  return `${tradeId}:${blockId}:${questionId}:${actorRole}`;
}

export function upsertAnswer(row: InMemoryAnswerRow): void {
  answers.set(answerKey(row.trade_id, row.block_id, row.question_id, row.actor_role), row);
}

export function latestAnswer(tradeId: string, blockId: string, questionId: string): InMemoryAnswerRow | null {
  const rows = [...answers.values()].filter(
    (r) => r.trade_id === tradeId && r.block_id === blockId && r.question_id === questionId
  );
  return rows.length ? rows[rows.length - 1] : null;
}

export function createAttachment(row: InMemoryAttachmentRow): void {
  attachments.set(row.id, row);
}

export function hasAttachmentForRequiredFile(tradeId: string, blockId: string, questionId: string): boolean {
  return [...attachments.values()].some(
    (a) =>
      a.trade_id === tradeId &&
      a.block_id === blockId &&
      (a.question_id === questionId || a.question_id === null)
  );
}

export function countAnswersSaved(tradeId: string, blockId: string): number {
  return [...answers.values()].filter((r) => r.trade_id === tradeId && r.block_id === blockId).length;
}
