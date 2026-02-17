import crypto from "crypto";

export type UserTemplateRecord = {
  id: string;
  owner_user_id: string;
  title: string;
  description: string | null;
  source_trade_id: string | null;
  template_json: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

const templates = new Map<string, UserTemplateRecord>();

export function listUserTemplates(ownerUserId: string): UserTemplateRecord[] {
  return [...templates.values()]
    .filter((t) => t.owner_user_id === ownerUserId)
    .sort((a, b) => (a.created_at < b.created_at ? -1 : 1));
}

export function getUserTemplate(id: string): UserTemplateRecord | null {
  return templates.get(id) ?? null;
}

export function createUserTemplate(input: {
  ownerUserId: string;
  title: string;
  description?: string;
  sourceTradeId?: string;
  templateJson: Record<string, unknown>;
}): UserTemplateRecord {
  const now = new Date().toISOString();
  const record: UserTemplateRecord = {
    id: crypto.randomUUID(),
    owner_user_id: input.ownerUserId,
    title: input.title,
    description: input.description ?? null,
    source_trade_id: input.sourceTradeId ?? null,
    template_json: input.templateJson,
    created_at: now,
    updated_at: now,
  };
  templates.set(record.id, record);
  return record;
}
