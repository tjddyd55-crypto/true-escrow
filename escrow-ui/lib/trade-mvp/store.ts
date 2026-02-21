import crypto from "crypto";
import { isDatabaseConfigured, query, withTransaction } from "@/lib/db";
import type {
  AuditAction,
  ConditionType,
  InviteType,
  MvpAuditLog,
  MvpBlock,
  MvpCondition,
  MvpInvite,
  MvpParticipant,
  MvpRole,
  MvpTrade,
  MvpUser,
} from "./types";

const memory = {
  users: [] as MvpUser[],
  trades: [] as MvpTrade[],
  participants: [] as MvpParticipant[],
  invites: [] as MvpInvite[],
  blocks: [] as MvpBlock[],
  conditions: [] as MvpCondition[],
  logs: [] as MvpAuditLog[],
};

function nowIso(): string {
  return new Date().toISOString();
}

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function publicUser(user: MvpUser) {
  return { id: user.id, email: user.email, name: user.name ?? null, createdAt: user.createdAt };
}

async function appendAuditLog(params: {
  tradeId: string;
  action: AuditAction;
  actorUserId?: string | null;
  meta?: Record<string, unknown>;
}): Promise<void> {
  if (!isDatabaseConfigured()) {
    memory.logs.push({
      id: crypto.randomUUID(),
      tradeId: params.tradeId,
      action: params.action,
      actorUserId: params.actorUserId ?? null,
      meta: params.meta ?? null,
      createdAt: nowIso(),
    });
    return;
  }
  await query(
    `INSERT INTO escrow_mvp_audit_logs
     (id, trade_id, action, actor_user_id, meta, created_at)
     VALUES ($1, $2, $3, $4, $5, now())`,
    [crypto.randomUUID(), params.tradeId, params.action, params.actorUserId ?? null, params.meta ?? {}]
  );
}

export async function signup(params: { email: string; password: string; name?: string }) {
  const email = normalizeEmail(params.email);
  const passwordHash = hashPassword(params.password);
  if (!isDatabaseConfigured()) {
    if (memory.users.some((u) => u.email === email)) {
      throw new Error("Email already exists");
    }
    const user: MvpUser = {
      id: crypto.randomUUID(),
      email,
      passwordHash,
      name: params.name?.trim() || null,
      createdAt: nowIso(),
    };
    memory.users.push(user);
    return publicUser(user);
  }
  const exists = await query<{ id: string }>("SELECT id FROM escrow_mvp_users WHERE email = $1 LIMIT 1", [email]);
  if (exists.rows[0]) throw new Error("Email already exists");
  const created = await query<{ id: string; email: string; name: string | null; created_at: string }>(
    `INSERT INTO escrow_mvp_users (id, email, password_hash, name, created_at)
     VALUES ($1, $2, $3, $4, now())
     RETURNING id, email, name, created_at`,
    [crypto.randomUUID(), email, passwordHash, params.name?.trim() || null]
  );
  const row = created.rows[0];
  return { id: row.id, email: row.email, name: row.name, createdAt: row.created_at };
}

export async function login(params: { email: string; password: string }) {
  const email = normalizeEmail(params.email);
  const passwordHash = hashPassword(params.password);
  if (!isDatabaseConfigured()) {
    const user = memory.users.find((u) => u.email === email && u.passwordHash === passwordHash);
    if (!user) return null;
    return publicUser(user);
  }
  const result = await query<{ id: string; email: string; name: string | null; password_hash: string; created_at: string }>(
    `SELECT id, email, name, password_hash, created_at
     FROM escrow_mvp_users
     WHERE email = $1
     LIMIT 1`,
    [email]
  );
  const row = result.rows[0];
  if (!row || row.password_hash !== passwordHash) return null;
  return { id: row.id, email: row.email, name: row.name, createdAt: row.created_at };
}

export async function getUserById(userId: string) {
  if (!isDatabaseConfigured()) {
    const user = memory.users.find((u) => u.id === userId);
    return user ? publicUser(user) : null;
  }
  const result = await query<{ id: string; email: string; name: string | null; created_at: string }>(
    "SELECT id, email, name, created_at FROM escrow_mvp_users WHERE id = $1 LIMIT 1",
    [userId]
  );
  const row = result.rows[0];
  return row ? { id: row.id, email: row.email, name: row.name, createdAt: row.created_at } : null;
}

export async function createTrade(params: { title: string; description?: string; createdBy: string }) {
  if (!isDatabaseConfigured()) {
    const trade: MvpTrade = {
      id: crypto.randomUUID(),
      title: params.title.trim(),
      description: params.description?.trim() || null,
      createdBy: params.createdBy,
      createdAt: nowIso(),
    };
    memory.trades.push(trade);
    memory.participants.push({
      id: crypto.randomUUID(),
      tradeId: trade.id,
      userId: params.createdBy,
      role: "BUYER",
      status: "ACCEPTED",
      inviteType: "EMAIL",
      inviteTarget: "",
      createdAt: nowIso(),
    });
    return trade;
  }
  return withTransaction(async (client) => {
    const tradeId = crypto.randomUUID();
    await client.query(
      `INSERT INTO escrow_mvp_trades (id, title, description, created_by, created_at)
       VALUES ($1, $2, $3, $4, now())`,
      [tradeId, params.title.trim(), params.description?.trim() || null, params.createdBy]
    );
    await client.query(
      `INSERT INTO escrow_mvp_trade_participants
       (id, trade_id, user_id, role, status, invite_type, invite_target, created_at)
       VALUES ($1, $2, $3, 'BUYER', 'ACCEPTED', 'EMAIL', '', now())`,
      [crypto.randomUUID(), tradeId, params.createdBy]
    );
    const row = await client.query<{ id: string; title: string; description: string | null; created_by: string; created_at: string }>(
      `SELECT id, title, description, created_by, created_at FROM escrow_mvp_trades WHERE id = $1`,
      [tradeId]
    );
    const r = row.rows[0];
    return {
      id: r.id,
      title: r.title,
      description: r.description,
      createdBy: r.created_by,
      createdAt: r.created_at,
    } as MvpTrade;
  });
}

export async function listMyTrades(userId: string): Promise<MvpTrade[]> {
  if (!isDatabaseConfigured()) {
    const participantTradeIds = new Set(
      memory.participants.filter((p) => p.userId === userId && p.status === "ACCEPTED").map((p) => p.tradeId)
    );
    return memory.trades.filter((t) => t.createdBy === userId || participantTradeIds.has(t.id));
  }
  const rows = await query<{ id: string; title: string; description: string | null; created_by: string; created_at: string }>(
    `SELECT DISTINCT t.id, t.title, t.description, t.created_by, t.created_at
     FROM escrow_mvp_trades t
     LEFT JOIN escrow_mvp_trade_participants p ON p.trade_id = t.id
     WHERE t.created_by = $1 OR (p.user_id = $1 AND p.status = 'ACCEPTED')
     ORDER BY t.created_at DESC`,
    [userId]
  );
  return rows.rows.map((r) => ({
    id: r.id,
    title: r.title,
    description: r.description,
    createdBy: r.created_by,
    createdAt: r.created_at,
  }));
}

async function getParticipantRole(tradeId: string, userId: string): Promise<MvpRole | null> {
  if (!isDatabaseConfigured()) {
    return memory.participants.find((p) => p.tradeId === tradeId && p.userId === userId && p.status === "ACCEPTED")?.role ?? null;
  }
  const result = await query<{ role: MvpRole }>(
    `SELECT role
     FROM escrow_mvp_trade_participants
     WHERE trade_id = $1 AND user_id = $2 AND status = 'ACCEPTED'
     LIMIT 1`,
    [tradeId, userId]
  );
  return result.rows[0]?.role ?? null;
}

export async function getTradeDetail(tradeId: string, userId: string) {
  const trades = await listMyTrades(userId);
  const trade = trades.find((t) => t.id === tradeId);
  if (!trade) return null;
  if (!isDatabaseConfigured()) {
    const participants = memory.participants.filter((p) => p.tradeId === tradeId);
    const blocks = memory.blocks.filter((b) => b.tradeId === tradeId);
    const conditions = memory.conditions.filter((c) => blocks.some((b) => b.id === c.blockId));
    return { trade, participants, blocks, conditions };
  }
  const [participantsResult, blocksResult, conditionsResult] = await Promise.all([
    query<{
      id: string;
      trade_id: string;
      user_id: string | null;
      role: MvpRole;
      status: "INVITED" | "ACCEPTED" | "DECLINED";
      invite_type: InviteType;
      invite_target: string;
      created_at: string;
    }>(
      `SELECT id, trade_id, user_id, role, status, invite_type, invite_target, created_at
       FROM escrow_mvp_trade_participants
       WHERE trade_id = $1
       ORDER BY created_at ASC`,
      [tradeId]
    ),
    query<{
      id: string;
      trade_id: string;
      title: string;
      due_at: string;
      final_approver_role: MvpRole;
      status: "DRAFT" | "OPEN" | "FINAL_APPROVED";
      created_at: string;
    }>(
      `SELECT id, trade_id, title, due_at, final_approver_role, status, created_at
       FROM escrow_mvp_blocks
       WHERE trade_id = $1
       ORDER BY created_at ASC`,
      [tradeId]
    ),
    query<{
      id: string;
      block_id: string;
      title: string;
      description: string | null;
      type: ConditionType;
      required: boolean;
      assigned_role: MvpRole;
      status: "PENDING" | "CONFIRMED";
      confirmed_by: string | null;
      confirmed_at: string | null;
      created_at: string;
    }>(
      `SELECT c.id, c.block_id, c.title, c.description, c.type, c.required,
              c.assigned_role, c.status, c.confirmed_by, c.confirmed_at, c.created_at
       FROM escrow_mvp_conditions c
       JOIN escrow_mvp_blocks b ON b.id = c.block_id
       WHERE b.trade_id = $1
       ORDER BY c.created_at ASC`,
      [tradeId]
    ),
  ]);
  return {
    trade,
    participants: participantsResult.rows.map((r) => ({
      id: r.id,
      tradeId: r.trade_id,
      userId: r.user_id,
      role: r.role,
      status: r.status,
      inviteType: r.invite_type,
      inviteTarget: r.invite_target,
      createdAt: r.created_at,
    })),
    blocks: blocksResult.rows.map((r) => ({
      id: r.id,
      tradeId: r.trade_id,
      title: r.title,
      dueAt: r.due_at,
      finalApproverRole: r.final_approver_role,
      status: r.status,
      createdAt: r.created_at,
    })),
    conditions: conditionsResult.rows.map((r) => ({
      id: r.id,
      blockId: r.block_id,
      title: r.title,
      description: r.description,
      type: r.type,
      required: r.required,
      assignedRole: r.assigned_role,
      status: r.status,
      confirmedBy: r.confirmed_by,
      confirmedAt: r.confirmed_at,
      createdAt: r.created_at,
    })),
  };
}

export async function createInvite(params: {
  tradeId: string;
  actorUserId: string;
  inviteType: InviteType;
  inviteTarget: string;
  role: MvpRole;
}) {
  const actorRole = await getParticipantRole(params.tradeId, params.actorUserId);
  if (!actorRole) throw new Error("Only participants can invite");
  const token = crypto.randomUUID();
  if (!isDatabaseConfigured()) {
    const participant: MvpParticipant = {
      id: crypto.randomUUID(),
      tradeId: params.tradeId,
      userId: null,
      role: params.role,
      status: "INVITED",
      inviteType: params.inviteType,
      inviteTarget: params.inviteTarget.trim(),
      createdAt: nowIso(),
    };
    memory.participants.push(participant);
    const invite: MvpInvite = {
      id: crypto.randomUUID(),
      tradeId: params.tradeId,
      participantId: participant.id,
      token,
      status: "PENDING",
      createdAt: nowIso(),
    };
    memory.invites.push(invite);
    await appendAuditLog({
      tradeId: params.tradeId,
      action: "INVITE_CREATED",
      actorUserId: params.actorUserId,
      meta: { inviteType: params.inviteType, inviteTarget: params.inviteTarget, role: params.role },
    });
    return invite;
  }
  return withTransaction(async (client) => {
    const participantId = crypto.randomUUID();
    const inviteId = crypto.randomUUID();
    await client.query(
      `INSERT INTO escrow_mvp_trade_participants
       (id, trade_id, user_id, role, status, invite_type, invite_target, created_at)
       VALUES ($1, $2, NULL, $3, 'INVITED', $4, $5, now())`,
      [participantId, params.tradeId, params.role, params.inviteType, params.inviteTarget.trim()]
    );
    await client.query(
      `INSERT INTO escrow_mvp_invites
       (id, trade_id, participant_id, token, status, created_at)
       VALUES ($1, $2, $3, $4, 'PENDING', now())`,
      [inviteId, params.tradeId, participantId, token]
    );
    await client.query(
      `INSERT INTO escrow_mvp_audit_logs (id, trade_id, action, actor_user_id, meta, created_at)
       VALUES ($1, $2, 'INVITE_CREATED', $3, $4, now())`,
      [
        crypto.randomUUID(),
        params.tradeId,
        params.actorUserId,
        { inviteType: params.inviteType, inviteTarget: params.inviteTarget, role: params.role },
      ]
    );
    return { id: inviteId, tradeId: params.tradeId, participantId, token, status: "PENDING", createdAt: nowIso() } as MvpInvite;
  });
}

export async function getInviteByToken(token: string) {
  if (!isDatabaseConfigured()) {
    const invite = memory.invites.find((i) => i.token === token);
    if (!invite) return null;
    const participant = memory.participants.find((p) => p.id === invite.participantId);
    const trade = memory.trades.find((t) => t.id === invite.tradeId);
    if (!participant || !trade) return null;
    return { invite, participant, trade };
  }
  const result = await query<{
    invite_id: string;
    invite_trade_id: string;
    invite_participant_id: string;
    invite_status: "PENDING" | "ACCEPTED" | "DECLINED";
    invite_created_at: string;
    participant_id: string;
    participant_user_id: string | null;
    participant_role: MvpRole;
    participant_status: "INVITED" | "ACCEPTED" | "DECLINED";
    participant_invite_type: InviteType;
    participant_invite_target: string;
    trade_id: string;
    trade_title: string;
    trade_description: string | null;
    trade_created_by: string;
    trade_created_at: string;
  }>(
    `SELECT
      i.id AS invite_id,
      i.trade_id AS invite_trade_id,
      i.participant_id AS invite_participant_id,
      i.status AS invite_status,
      i.created_at AS invite_created_at,
      p.id AS participant_id,
      p.user_id AS participant_user_id,
      p.role AS participant_role,
      p.status AS participant_status,
      p.invite_type AS participant_invite_type,
      p.invite_target AS participant_invite_target,
      t.id AS trade_id,
      t.title AS trade_title,
      t.description AS trade_description,
      t.created_by AS trade_created_by,
      t.created_at AS trade_created_at
     FROM escrow_mvp_invites i
     JOIN escrow_mvp_trade_participants p ON p.id = i.participant_id
     JOIN escrow_mvp_trades t ON t.id = i.trade_id
     WHERE i.token = $1
     LIMIT 1`,
    [token]
  );
  const row = result.rows[0];
  if (!row) return null;
  return {
    invite: {
      id: row.invite_id,
      tradeId: row.invite_trade_id,
      participantId: row.invite_participant_id,
      token,
      status: row.invite_status,
      createdAt: row.invite_created_at,
    } as MvpInvite,
    participant: {
      id: row.participant_id,
      tradeId: row.invite_trade_id,
      userId: row.participant_user_id,
      role: row.participant_role,
      status: row.participant_status,
      inviteType: row.participant_invite_type,
      inviteTarget: row.participant_invite_target,
      createdAt: row.invite_created_at,
    } as MvpParticipant,
    trade: {
      id: row.trade_id,
      title: row.trade_title,
      description: row.trade_description,
      createdBy: row.trade_created_by,
      createdAt: row.trade_created_at,
    } as MvpTrade,
  };
}

export async function acceptInvite(token: string, userId: string) {
  const info = await getInviteByToken(token);
  if (!info) throw new Error("Invite not found");
  if (info.invite.status !== "PENDING") throw new Error("Invite is not pending");
  if (info.participant.userId && info.participant.userId !== userId) {
    throw new Error("Invite already claimed by another user");
  }
  if (!isDatabaseConfigured()) {
    const invite = memory.invites.find((i) => i.id === info.invite.id)!;
    const participant = memory.participants.find((p) => p.id === info.participant.id)!;
    invite.status = "ACCEPTED";
    participant.status = "ACCEPTED";
    participant.userId = userId;
    await appendAuditLog({
      tradeId: info.trade.id,
      action: "INVITE_ACCEPTED",
      actorUserId: userId,
      meta: { inviteId: invite.id, participantId: participant.id },
    });
    return { invite, participant };
  }
  return withTransaction(async (client) => {
    await client.query(`UPDATE escrow_mvp_invites SET status = 'ACCEPTED' WHERE id = $1`, [info.invite.id]);
    await client.query(
      `UPDATE escrow_mvp_trade_participants
       SET status = 'ACCEPTED', user_id = $1
       WHERE id = $2`,
      [userId, info.participant.id]
    );
    await client.query(
      `INSERT INTO escrow_mvp_audit_logs (id, trade_id, action, actor_user_id, meta, created_at)
       VALUES ($1, $2, 'INVITE_ACCEPTED', $3, $4, now())`,
      [crypto.randomUUID(), info.trade.id, userId, { inviteId: info.invite.id, participantId: info.participant.id }]
    );
    return { inviteId: info.invite.id, participantId: info.participant.id };
  });
}

export async function declineInvite(token: string, userId: string) {
  const info = await getInviteByToken(token);
  if (!info) throw new Error("Invite not found");
  if (info.invite.status !== "PENDING") throw new Error("Invite is not pending");
  if (!isDatabaseConfigured()) {
    const invite = memory.invites.find((i) => i.id === info.invite.id)!;
    const participant = memory.participants.find((p) => p.id === info.participant.id)!;
    invite.status = "DECLINED";
    participant.status = "DECLINED";
    if (!participant.userId) participant.userId = userId;
    return;
  }
  await withTransaction(async (client) => {
    await client.query(`UPDATE escrow_mvp_invites SET status = 'DECLINED' WHERE id = $1`, [info.invite.id]);
    await client.query(
      `UPDATE escrow_mvp_trade_participants
       SET status = 'DECLINED', user_id = COALESCE(user_id, $1)
       WHERE id = $2`,
      [userId, info.participant.id]
    );
  });
}

export async function createBlock(params: {
  tradeId: string;
  actorUserId: string;
  title: string;
  dueAt: string;
  finalApproverRole: MvpRole;
}) {
  const role = await getParticipantRole(params.tradeId, params.actorUserId);
  if (!role) throw new Error("Only participants can create blocks");
  if (!isDatabaseConfigured()) {
    const block: MvpBlock = {
      id: crypto.randomUUID(),
      tradeId: params.tradeId,
      title: params.title.trim(),
      dueAt: params.dueAt,
      finalApproverRole: params.finalApproverRole,
      status: "DRAFT",
      createdAt: nowIso(),
    };
    memory.blocks.push(block);
    return block;
  }
  const result = await query<{
    id: string;
    trade_id: string;
    title: string;
    due_at: string;
    final_approver_role: MvpRole;
    status: "DRAFT" | "OPEN" | "FINAL_APPROVED";
    created_at: string;
  }>(
    `INSERT INTO escrow_mvp_blocks
     (id, trade_id, title, due_at, final_approver_role, status, created_at)
     VALUES ($1, $2, $3, $4, $5, 'DRAFT', now())
     RETURNING id, trade_id, title, due_at, final_approver_role, status, created_at`,
    [crypto.randomUUID(), params.tradeId, params.title.trim(), params.dueAt, params.finalApproverRole]
  );
  const row = result.rows[0];
  return {
    id: row.id,
    tradeId: row.trade_id,
    title: row.title,
    dueAt: row.due_at,
    finalApproverRole: row.final_approver_role,
    status: row.status,
    createdAt: row.created_at,
  } as MvpBlock;
}

export async function saveBlockDraft(params: {
  tradeId: string;
  blockId: string;
  actorUserId: string;
  title: string;
  dueAt: string;
  finalApproverRole: MvpRole;
}) {
  const role = await getParticipantRole(params.tradeId, params.actorUserId);
  if (!role) throw new Error("Only participants can edit blocks");
  if (!isDatabaseConfigured()) {
    const block = memory.blocks.find((b) => b.id === params.blockId && b.tradeId === params.tradeId);
    if (!block) throw new Error("Block not found");
    if (block.status === "FINAL_APPROVED") throw new Error("Approved block cannot be edited");
    block.title = params.title.trim();
    block.dueAt = params.dueAt;
    block.finalApproverRole = params.finalApproverRole;
    block.status = "OPEN";
    return block;
  }
  const updated = await query<{
    id: string;
    trade_id: string;
    title: string;
    due_at: string;
    final_approver_role: MvpRole;
    status: "DRAFT" | "OPEN" | "FINAL_APPROVED";
    created_at: string;
  }>(
    `UPDATE escrow_mvp_blocks
     SET title = $1, due_at = $2, final_approver_role = $3, status = 'OPEN'
     WHERE id = $4 AND trade_id = $5 AND status <> 'FINAL_APPROVED'
     RETURNING id, trade_id, title, due_at, final_approver_role, status, created_at`,
    [params.title.trim(), params.dueAt, params.finalApproverRole, params.blockId, params.tradeId]
  );
  const row = updated.rows[0];
  if (!row) throw new Error("Block not found or cannot be edited");
  return {
    id: row.id,
    tradeId: row.trade_id,
    title: row.title,
    dueAt: row.due_at,
    finalApproverRole: row.final_approver_role,
    status: row.status,
    createdAt: row.created_at,
  } as MvpBlock;
}

export async function addCondition(params: {
  tradeId: string;
  blockId: string;
  actorUserId: string;
  title: string;
  description?: string;
  type: ConditionType;
  required: boolean;
  assignedRole: MvpRole;
}) {
  const role = await getParticipantRole(params.tradeId, params.actorUserId);
  if (!role) throw new Error("Only participants can add conditions");
  if (!isDatabaseConfigured()) {
    const block = memory.blocks.find((b) => b.id === params.blockId && b.tradeId === params.tradeId);
    if (!block) throw new Error("Block not found");
    const condition: MvpCondition = {
      id: crypto.randomUUID(),
      blockId: params.blockId,
      title: params.title.trim(),
      description: params.description?.trim() || null,
      type: params.type,
      required: params.required,
      assignedRole: params.assignedRole,
      status: "PENDING",
      confirmedBy: null,
      confirmedAt: null,
      createdAt: nowIso(),
    };
    memory.conditions.push(condition);
    return condition;
  }
  const inserted = await query<{
    id: string;
    block_id: string;
    title: string;
    description: string | null;
    type: ConditionType;
    required: boolean;
    assigned_role: MvpRole;
    status: "PENDING" | "CONFIRMED";
    confirmed_by: string | null;
    confirmed_at: string | null;
    created_at: string;
  }>(
    `INSERT INTO escrow_mvp_conditions
     (id, block_id, title, description, type, required, assigned_role, status, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, 'PENDING', now())
     RETURNING id, block_id, title, description, type, required, assigned_role, status, confirmed_by, confirmed_at, created_at`,
    [crypto.randomUUID(), params.blockId, params.title.trim(), params.description?.trim() || null, params.type, params.required, params.assignedRole]
  );
  const row = inserted.rows[0];
  return {
    id: row.id,
    blockId: row.block_id,
    title: row.title,
    description: row.description,
    type: row.type,
    required: row.required,
    assignedRole: row.assigned_role,
    status: row.status,
    confirmedBy: row.confirmed_by,
    confirmedAt: row.confirmed_at,
    createdAt: row.created_at,
  } as MvpCondition;
}

export async function confirmCondition(params: {
  tradeId: string;
  blockId: string;
  conditionId: string;
  actorUserId: string;
}) {
  const actorRole = await getParticipantRole(params.tradeId, params.actorUserId);
  if (!actorRole) throw new Error("Only accepted participants can confirm conditions");
  const detail = await getTradeDetail(params.tradeId, params.actorUserId);
  if (!detail) throw new Error("Trade not found");
  const condition = detail.conditions.find((c) => c.id === params.conditionId && c.blockId === params.blockId);
  if (!condition) throw new Error("Condition not found");
  if (condition.assignedRole !== actorRole) {
    throw new Error("Only assigned role can confirm this condition");
  }
  if (!isDatabaseConfigured()) {
    const target = memory.conditions.find((c) => c.id === params.conditionId)!;
    target.status = "CONFIRMED";
    target.confirmedBy = params.actorUserId;
    target.confirmedAt = nowIso();
    await appendAuditLog({
      tradeId: params.tradeId,
      action: "CONDITION_CONFIRMED",
      actorUserId: params.actorUserId,
      meta: { blockId: params.blockId, conditionId: params.conditionId },
    });
    return target;
  }
  const updated = await query<{
    id: string;
    block_id: string;
    title: string;
    description: string | null;
    type: ConditionType;
    required: boolean;
    assigned_role: MvpRole;
    status: "PENDING" | "CONFIRMED";
    confirmed_by: string | null;
    confirmed_at: string | null;
    created_at: string;
  }>(
    `UPDATE escrow_mvp_conditions
     SET status = 'CONFIRMED', confirmed_by = $1, confirmed_at = now()
     WHERE id = $2 AND block_id = $3
     RETURNING id, block_id, title, description, type, required, assigned_role, status, confirmed_by, confirmed_at, created_at`,
    [params.actorUserId, params.conditionId, params.blockId]
  );
  const row = updated.rows[0];
  if (!row) throw new Error("Condition not found");
  await appendAuditLog({
    tradeId: params.tradeId,
    action: "CONDITION_CONFIRMED",
    actorUserId: params.actorUserId,
    meta: { blockId: params.blockId, conditionId: params.conditionId },
  });
  return {
    id: row.id,
    blockId: row.block_id,
    title: row.title,
    description: row.description,
    type: row.type,
    required: row.required,
    assignedRole: row.assigned_role,
    status: row.status,
    confirmedBy: row.confirmed_by,
    confirmedAt: row.confirmed_at,
    createdAt: row.created_at,
  } as MvpCondition;
}

export async function finalApproveBlock(params: { tradeId: string; blockId: string; actorUserId: string }) {
  const actorRole = await getParticipantRole(params.tradeId, params.actorUserId);
  if (!actorRole) throw new Error("Only accepted participants can final-approve");
  const detail = await getTradeDetail(params.tradeId, params.actorUserId);
  if (!detail) throw new Error("Trade not found");
  const block = detail.blocks.find((b) => b.id === params.blockId);
  if (!block) throw new Error("Block not found");
  if (block.finalApproverRole !== actorRole) {
    throw new Error("Only final approver role can approve");
  }
  const blockConditions = detail.conditions.filter((c) => c.blockId === params.blockId);
  const missingRequired = blockConditions.filter((c) => c.required && c.status !== "CONFIRMED");
  if (missingRequired.length > 0) {
    throw new Error("All required conditions must be confirmed");
  }
  if (!isDatabaseConfigured()) {
    const target = memory.blocks.find((b) => b.id === params.blockId)!;
    target.status = "FINAL_APPROVED";
    await appendAuditLog({
      tradeId: params.tradeId,
      action: "BLOCK_FINAL_APPROVED",
      actorUserId: params.actorUserId,
      meta: { blockId: params.blockId },
    });
    return target;
  }
  const updated = await query<{
    id: string;
    trade_id: string;
    title: string;
    due_at: string;
    final_approver_role: MvpRole;
    status: "DRAFT" | "OPEN" | "FINAL_APPROVED";
    created_at: string;
  }>(
    `UPDATE escrow_mvp_blocks
     SET status = 'FINAL_APPROVED'
     WHERE id = $1 AND trade_id = $2
     RETURNING id, trade_id, title, due_at, final_approver_role, status, created_at`,
    [params.blockId, params.tradeId]
  );
  const row = updated.rows[0];
  if (!row) throw new Error("Block not found");
  await appendAuditLog({
    tradeId: params.tradeId,
    action: "BLOCK_FINAL_APPROVED",
    actorUserId: params.actorUserId,
    meta: { blockId: params.blockId },
  });
  return {
    id: row.id,
    tradeId: row.trade_id,
    title: row.title,
    dueAt: row.due_at,
    finalApproverRole: row.final_approver_role,
    status: row.status,
    createdAt: row.created_at,
  } as MvpBlock;
}
