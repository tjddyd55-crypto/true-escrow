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
      status: "DRAFT",
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
      `INSERT INTO escrow_mvp_trades (id, title, description, created_by, status, created_at)
       VALUES ($1, $2, $3, $4, 'DRAFT', now())`,
      [tradeId, params.title.trim(), params.description?.trim() || null, params.createdBy]
    );
    await client.query(
      `INSERT INTO escrow_mvp_trade_participants
       (id, trade_id, user_id, role, status, invite_type, invite_target, created_at)
       VALUES ($1, $2, $3, 'BUYER', 'ACCEPTED', 'EMAIL', '', now())`,
      [crypto.randomUUID(), tradeId, params.createdBy]
    );
    const row = await client.query<{ id: string; title: string; description: string | null; created_by: string; status: "DRAFT" | "ACTIVE" | "COMPLETED"; created_at: string }>(
      `SELECT id, title, description, created_by, status, created_at FROM escrow_mvp_trades WHERE id = $1`,
      [tradeId]
    );
    const r = row.rows[0];
    return {
      id: r.id,
      title: r.title,
      description: r.description,
      createdBy: r.created_by,
      status: r.status,
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
  const rows = await query<{ id: string; title: string; description: string | null; created_by: string; status: "DRAFT" | "ACTIVE" | "COMPLETED"; created_at: string }>(
    `SELECT DISTINCT t.id, t.title, t.description, t.created_by, t.status, t.created_at
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
    status: r.status,
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

function hasAllRequiredConfirmed(conditions: MvpCondition[]): boolean {
  if (conditions.length === 0) return false;
  const requiredConditions = conditions.filter((c) => c.required);
  if (requiredConditions.length === 0) return false;
  return requiredConditions.every((c) => c.status === "CONFIRMED");
}

function ensureBlockStatusFromConditions(block: MvpBlock, conditions: MvpCondition[]): MvpBlock {
  if (block.status === "APPROVED") return block;
  if (hasAllRequiredConfirmed(conditions)) {
    return { ...block, status: "READY_FOR_FINAL_APPROVAL" };
  }
  return { ...block, status: "IN_PROGRESS" };
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
      start_date: string | null;
      due_date: string;
      approval_type: "MANUAL" | "SIMPLE";
      final_approver_role: MvpRole;
      watchers: unknown;
      extended_due_date: string | null;
      status: "DRAFT" | "IN_PROGRESS" | "READY_FOR_FINAL_APPROVAL" | "APPROVED" | "DISPUTED" | "ON_HOLD";
      created_at: string;
    }>(
      `SELECT id, trade_id, title, start_date, due_date, approval_type, final_approver_role, watchers, extended_due_date, status, created_at
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
      confirmer_role: MvpRole;
      status: "PENDING" | "SUBMITTED" | "CONFIRMED" | "REJECTED";
      reject_reason: string | null;
      rejected_by: string | null;
      rejected_at: string | null;
      resubmitted_at: string | null;
      submitted_at: string | null;
      confirmed_by: string | null;
      confirmed_at: string | null;
      created_at: string;
    }>(
      `SELECT c.id, c.block_id, c.title, c.description, c.type, c.required,
              c.assigned_role, c.confirmer_role, c.status, c.reject_reason, c.rejected_by, c.rejected_at,
              c.resubmitted_at, c.submitted_at, c.confirmed_by, c.confirmed_at, c.created_at
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
      startDate: r.start_date,
      dueDate: r.due_date,
      approvalType: r.approval_type,
      finalApproverRole: r.final_approver_role,
      watchers: Array.isArray(r.watchers) ? (r.watchers as MvpRole[]) : [],
      extendedDueDate: r.extended_due_date,
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
      confirmerRole: r.confirmer_role,
      status: r.status,
      rejectReason: r.reject_reason,
      rejectedBy: r.rejected_by,
      rejectedAt: r.rejected_at,
      resubmittedAt: r.resubmitted_at,
      submittedAt: r.submitted_at,
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
      meta: { inviteId: invite.id, inviteType: params.inviteType, inviteTarget: params.inviteTarget, role: params.role },
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
        { inviteId, inviteType: params.inviteType, inviteTarget: params.inviteTarget, role: params.role },
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
  startDate?: string | null;
  dueDate: string;
  approvalType?: "MANUAL" | "SIMPLE";
  finalApproverRole: MvpRole;
  watchers?: MvpRole[];
}) {
  const role = await getParticipantRole(params.tradeId, params.actorUserId);
  if (!role) throw new Error("Only participants can create blocks");
  if (!isDatabaseConfigured()) {
    const block: MvpBlock = {
      id: crypto.randomUUID(),
      tradeId: params.tradeId,
      title: params.title.trim(),
      startDate: params.startDate ?? null,
      dueDate: params.dueDate,
      approvalType: params.approvalType ?? "MANUAL",
      finalApproverRole: params.finalApproverRole,
      watchers: params.watchers ?? [],
      status: "IN_PROGRESS",
      createdAt: nowIso(),
    };
    memory.blocks.push(block);
    return block;
  }
  const result = await query<{
    id: string;
    trade_id: string;
    title: string;
    start_date: string | null;
    due_date: string;
    approval_type: "MANUAL" | "SIMPLE";
    final_approver_role: MvpRole;
    watchers: unknown;
    extended_due_date: string | null;
    status: "DRAFT" | "IN_PROGRESS" | "READY_FOR_FINAL_APPROVAL" | "APPROVED" | "DISPUTED" | "ON_HOLD";
    created_at: string;
  }>(
    `INSERT INTO escrow_mvp_blocks
     (id, trade_id, title, start_date, due_date, approval_type, final_approver_role, watchers, status, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, 'IN_PROGRESS', now())
     RETURNING id, trade_id, title, start_date, due_date, approval_type, final_approver_role, watchers, extended_due_date, status, created_at`,
    [
      crypto.randomUUID(),
      params.tradeId,
      params.title.trim(),
      params.startDate ?? null,
      params.dueDate,
      params.approvalType ?? "MANUAL",
      params.finalApproverRole,
      JSON.stringify(params.watchers ?? []),
    ]
  );
  const row = result.rows[0];
  return {
    id: row.id,
    tradeId: row.trade_id,
    title: row.title,
    startDate: row.start_date,
    dueDate: row.due_date,
    approvalType: row.approval_type,
    finalApproverRole: row.final_approver_role,
    watchers: Array.isArray(row.watchers) ? (row.watchers as MvpRole[]) : [],
    extendedDueDate: row.extended_due_date,
    status: row.status,
    createdAt: row.created_at,
  } as MvpBlock;
}

export async function saveBlockDraft(params: {
  tradeId: string;
  blockId: string;
  actorUserId: string;
  title: string;
  startDate?: string | null;
  dueDate: string;
  approvalType?: "MANUAL" | "SIMPLE";
  finalApproverRole: MvpRole;
  watchers?: MvpRole[];
}) {
  const role = await getParticipantRole(params.tradeId, params.actorUserId);
  if (!role) throw new Error("Only participants can edit blocks");
  if (!isDatabaseConfigured()) {
    const block = memory.blocks.find((b) => b.id === params.blockId && b.tradeId === params.tradeId);
    if (!block) throw new Error("Block not found");
    if (block.status === "APPROVED") throw new Error("Approved block cannot be edited");
    block.title = params.title.trim();
    block.startDate = params.startDate ?? null;
    block.dueDate = params.dueDate;
    block.approvalType = params.approvalType ?? "MANUAL";
    block.finalApproverRole = params.finalApproverRole;
    block.watchers = params.watchers ?? [];
    block.status = "IN_PROGRESS";
    return block;
  }
  const updated = await query<{
    id: string;
    trade_id: string;
    title: string;
    start_date: string | null;
    due_date: string;
    approval_type: "MANUAL" | "SIMPLE";
    final_approver_role: MvpRole;
    watchers: unknown;
    extended_due_date: string | null;
    status: "DRAFT" | "IN_PROGRESS" | "READY_FOR_FINAL_APPROVAL" | "APPROVED" | "DISPUTED" | "ON_HOLD";
    created_at: string;
  }>(
    `UPDATE escrow_mvp_blocks
     SET title = $1, start_date = $2, due_date = $3, approval_type = $4, final_approver_role = $5, watchers = $6::jsonb, status = 'IN_PROGRESS'
     WHERE id = $7 AND trade_id = $8 AND status <> 'APPROVED'
     RETURNING id, trade_id, title, start_date, due_date, approval_type, final_approver_role, watchers, extended_due_date, status, created_at`,
    [
      params.title.trim(),
      params.startDate ?? null,
      params.dueDate,
      params.approvalType ?? "MANUAL",
      params.finalApproverRole,
      JSON.stringify(params.watchers ?? []),
      params.blockId,
      params.tradeId,
    ]
  );
  const row = updated.rows[0];
  if (!row) throw new Error("Block not found or cannot be edited");
  return {
    id: row.id,
    tradeId: row.trade_id,
    title: row.title,
    startDate: row.start_date,
    dueDate: row.due_date,
    approvalType: row.approval_type,
    finalApproverRole: row.final_approver_role,
    watchers: Array.isArray(row.watchers) ? (row.watchers as MvpRole[]) : [],
    extendedDueDate: row.extended_due_date,
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
  confirmerRole: MvpRole;
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
      confirmerRole: params.confirmerRole,
      status: "PENDING",
      rejectReason: null,
      rejectedBy: null,
      rejectedAt: null,
      resubmittedAt: null,
      submittedAt: null,
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
    confirmer_role: MvpRole;
    status: "PENDING" | "SUBMITTED" | "CONFIRMED" | "REJECTED";
    reject_reason: string | null;
    rejected_by: string | null;
    rejected_at: string | null;
    resubmitted_at: string | null;
    submitted_at: string | null;
    confirmed_by: string | null;
    confirmed_at: string | null;
    created_at: string;
  }>(
    `INSERT INTO escrow_mvp_conditions
     (id, block_id, title, description, type, required, assigned_role, confirmer_role, status, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'PENDING', now())
     RETURNING id, block_id, title, description, type, required, assigned_role, confirmer_role, status, reject_reason, rejected_by, rejected_at, resubmitted_at, submitted_at, confirmed_by, confirmed_at, created_at`,
    [crypto.randomUUID(), params.blockId, params.title.trim(), params.description?.trim() || null, params.type, params.required, params.assignedRole, params.confirmerRole]
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
    confirmerRole: row.confirmer_role,
    status: row.status,
    rejectReason: row.reject_reason,
    rejectedBy: row.rejected_by,
    rejectedAt: row.rejected_at,
    resubmittedAt: row.resubmitted_at,
    submittedAt: row.submitted_at,
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
  if (condition.confirmerRole !== actorRole) {
    throw new Error("Only confirmer role can confirm this condition");
  }
  if (condition.status !== "SUBMITTED") {
    throw new Error("Only submitted condition can be confirmed");
  }
  if (!isDatabaseConfigured()) {
    const target = memory.conditions.find((c) => c.id === params.conditionId)!;
    target.status = "CONFIRMED";
    target.confirmedBy = params.actorUserId;
    target.confirmedAt = nowIso();
    const block = memory.blocks.find((b) => b.id === params.blockId && b.tradeId === params.tradeId);
    if (block) {
      const blockConditions = memory.conditions.filter((c) => c.blockId === block.id);
      const next = ensureBlockStatusFromConditions(block, blockConditions);
      Object.assign(block, next);
    }
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
    confirmer_role: MvpRole;
    status: "PENDING" | "SUBMITTED" | "CONFIRMED" | "REJECTED";
    reject_reason: string | null;
    rejected_by: string | null;
    rejected_at: string | null;
    resubmitted_at: string | null;
    submitted_at: string | null;
    confirmed_by: string | null;
    confirmed_at: string | null;
    created_at: string;
  }>(
    `UPDATE escrow_mvp_conditions
     SET status = 'CONFIRMED', confirmed_by = $1, confirmed_at = now()
     WHERE id = $2 AND block_id = $3 AND status = 'SUBMITTED'
     RETURNING id, block_id, title, description, type, required, assigned_role, confirmer_role, status, reject_reason, rejected_by, rejected_at, resubmitted_at, submitted_at, confirmed_by, confirmed_at, created_at`,
    [params.actorUserId, params.conditionId, params.blockId]
  );
  const row = updated.rows[0];
  if (!row) throw new Error("Condition not found or not submitted");
  await query(
    `UPDATE escrow_mvp_blocks b
     SET status = CASE
       WHEN EXISTS (
         SELECT 1 FROM escrow_mvp_conditions c
         WHERE c.block_id = b.id AND c.required = true
       ) AND NOT EXISTS (
         SELECT 1 FROM escrow_mvp_conditions c
         WHERE c.block_id = b.id AND c.required = true AND c.status <> 'CONFIRMED'
       ) THEN 'READY_FOR_FINAL_APPROVAL'
       ELSE 'IN_PROGRESS'
     END
     WHERE b.id = $1 AND b.trade_id = $2`,
    [params.blockId, params.tradeId]
  );
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
    confirmerRole: row.confirmer_role,
    status: row.status,
    rejectReason: row.reject_reason,
    rejectedBy: row.rejected_by,
    rejectedAt: row.rejected_at,
    resubmittedAt: row.resubmitted_at,
    submittedAt: row.submitted_at,
    confirmedBy: row.confirmed_by,
    confirmedAt: row.confirmed_at,
    createdAt: row.created_at,
  } as MvpCondition;
}

export async function submitCondition(params: {
  tradeId: string;
  blockId: string;
  conditionId: string;
  actorUserId: string;
  isResubmit?: boolean;
}) {
  const actorRole = await getParticipantRole(params.tradeId, params.actorUserId);
  if (!actorRole) throw new Error("Only accepted participants can submit conditions");
  const detail = await getTradeDetail(params.tradeId, params.actorUserId);
  if (!detail) throw new Error("Trade not found");
  const condition = detail.conditions.find((c) => c.id === params.conditionId && c.blockId === params.blockId);
  if (!condition) throw new Error("Condition not found");
  if (condition.assignedRole !== actorRole) throw new Error("Only assigned role can submit this condition");
  if (!(condition.status === "PENDING" || condition.status === "REJECTED")) {
    throw new Error("Only pending/rejected condition can be submitted");
  }

  if (!isDatabaseConfigured()) {
    const target = memory.conditions.find((c) => c.id === params.conditionId)!;
    target.status = "SUBMITTED";
    target.submittedAt = nowIso();
    if (params.isResubmit || condition.status === "REJECTED") target.resubmittedAt = nowIso();
    target.rejectReason = null;
    target.rejectedBy = null;
    target.rejectedAt = null;
    await appendAuditLog({
      tradeId: params.tradeId,
      action: params.isResubmit || condition.status === "REJECTED" ? "CONDITION_RESUBMITTED" : "CONDITION_SUBMITTED",
      actorUserId: params.actorUserId,
      meta: { blockId: params.blockId, conditionId: params.conditionId },
    });
    return target;
  }

  const updated = await query(
    `UPDATE escrow_mvp_conditions
     SET status = 'SUBMITTED',
         submitted_at = now(),
         resubmitted_at = CASE WHEN status = 'REJECTED' THEN now() ELSE resubmitted_at END,
         reject_reason = NULL,
         rejected_by = NULL,
         rejected_at = NULL
     WHERE id = $1 AND block_id = $2 AND status IN ('PENDING', 'REJECTED')
     RETURNING id`,
    [params.conditionId, params.blockId]
  );
  if (!updated.rows[0]) throw new Error("Condition not found or cannot be submitted");
  await appendAuditLog({
    tradeId: params.tradeId,
    action: params.isResubmit || condition.status === "REJECTED" ? "CONDITION_RESUBMITTED" : "CONDITION_SUBMITTED",
    actorUserId: params.actorUserId,
    meta: { blockId: params.blockId, conditionId: params.conditionId },
  });
  return { id: params.conditionId, status: "SUBMITTED" as const };
}

export async function rejectConditionWithExtension(params: {
  tradeId: string;
  blockId: string;
  conditionId: string;
  actorUserId: string;
  rejectReason: string;
  newDueDate: string;
}) {
  const actorRole = await getParticipantRole(params.tradeId, params.actorUserId);
  if (!actorRole) throw new Error("Only accepted participants can reject conditions");
  if (!params.rejectReason.trim()) throw new Error("rejectReason is required");
  if (!params.newDueDate) throw new Error("newDueDate is required");
  const detail = await getTradeDetail(params.tradeId, params.actorUserId);
  if (!detail) throw new Error("Trade not found");
  const condition = detail.conditions.find((c) => c.id === params.conditionId && c.blockId === params.blockId);
  if (!condition) throw new Error("Condition not found");
  if (condition.confirmerRole !== actorRole) throw new Error("Only confirmer role can reject this condition");
  if (condition.status !== "SUBMITTED") throw new Error("Only submitted condition can be rejected");

  if (!isDatabaseConfigured()) {
    const target = memory.conditions.find((c) => c.id === params.conditionId)!;
    target.status = "REJECTED";
    target.rejectReason = params.rejectReason.trim();
    target.rejectedBy = params.actorUserId;
    target.rejectedAt = nowIso();
    const block = memory.blocks.find((b) => b.id === params.blockId && b.tradeId === params.tradeId);
    if (block) {
      block.extendedDueDate = params.newDueDate;
      block.dueDate = params.newDueDate;
      block.status = "IN_PROGRESS";
    }
    await appendAuditLog({
      tradeId: params.tradeId,
      action: "CONDITION_REJECTED",
      actorUserId: params.actorUserId,
      meta: {
        blockId: params.blockId,
        conditionId: params.conditionId,
        rejectReason: params.rejectReason.trim(),
        newDueDate: params.newDueDate,
      },
    });
    return target;
  }

  await withTransaction(async (client) => {
    const updated = await client.query(
      `UPDATE escrow_mvp_conditions
       SET status = 'REJECTED',
           reject_reason = $1,
           rejected_by = $2,
           rejected_at = now()
       WHERE id = $3 AND block_id = $4 AND status = 'SUBMITTED'
       RETURNING id`,
      [params.rejectReason.trim(), params.actorUserId, params.conditionId, params.blockId]
    );
    if (!updated.rows[0]) throw new Error("Condition not found or cannot be rejected");
    await client.query(
      `UPDATE escrow_mvp_blocks
       SET due_date = $1, extended_due_date = $1, status = 'IN_PROGRESS'
       WHERE id = $2 AND trade_id = $3`,
      [params.newDueDate, params.blockId, params.tradeId]
    );
    await client.query(
      `INSERT INTO escrow_mvp_audit_logs (id, trade_id, action, actor_user_id, meta, created_at)
       VALUES ($1, $2, 'CONDITION_REJECTED', $3, $4, now())`,
      [
        crypto.randomUUID(),
        params.tradeId,
        params.actorUserId,
        {
          blockId: params.blockId,
          conditionId: params.conditionId,
          rejectReason: params.rejectReason.trim(),
          newDueDate: params.newDueDate,
        },
      ]
    );
  });
  return { id: params.conditionId, status: "REJECTED" as const };
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
  if (block.status !== "READY_FOR_FINAL_APPROVAL") throw new Error("Block is not ready for final approval");
  if (!isDatabaseConfigured()) {
    const target = memory.blocks.find((b) => b.id === params.blockId)!;
    target.status = "APPROVED";
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
    start_date: string | null;
    due_date: string;
    approval_type: "MANUAL" | "SIMPLE";
    final_approver_role: MvpRole;
    watchers: unknown;
    extended_due_date: string | null;
    status: "DRAFT" | "IN_PROGRESS" | "READY_FOR_FINAL_APPROVAL" | "APPROVED" | "DISPUTED" | "ON_HOLD";
    created_at: string;
  }>(
    `UPDATE escrow_mvp_blocks
     SET status = 'APPROVED'
     WHERE id = $1 AND trade_id = $2 AND status = 'READY_FOR_FINAL_APPROVAL'
     RETURNING id, trade_id, title, start_date, due_date, approval_type, final_approver_role, watchers, extended_due_date, status, created_at`,
    [params.blockId, params.tradeId]
  );
  const row = updated.rows[0];
  if (!row) throw new Error("Block not found or not ready for final approval");
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
    startDate: row.start_date,
    dueDate: row.due_date,
    approvalType: row.approval_type,
    finalApproverRole: row.final_approver_role,
    watchers: Array.isArray(row.watchers) ? (row.watchers as MvpRole[]) : [],
    extendedDueDate: row.extended_due_date,
    status: row.status,
    createdAt: row.created_at,
  } as MvpBlock;
}

export async function getDashboardSummary(userId: string): Promise<{
  createdTrades: MvpTrade[];
  participantTrades: MvpTrade[];
  pendingActions: Array<{
    tradeId: string;
    tradeTitle: string;
    blockId: string;
    blockTitle: string;
    conditionId: string;
    conditionTitle: string;
    assignedRole: MvpRole;
    conditionType: ConditionType;
  }>;
}> {
  if (!isDatabaseConfigured()) {
    const createdTrades = memory.trades.filter((t) => t.createdBy === userId);
    const participantTradeIds = new Set(
      memory.participants
        .filter((p) => p.userId === userId && p.status === "ACCEPTED")
        .map((p) => p.tradeId)
    );
    const participantTrades = memory.trades.filter((t) => t.createdBy !== userId && participantTradeIds.has(t.id));
    const myRolesByTrade = new Map(
      memory.participants
        .filter((p) => p.userId === userId && p.status === "ACCEPTED")
        .map((p) => [p.tradeId, p.role] as const)
    );
    const pendingActions = memory.conditions
      .filter((c) => c.status === "SUBMITTED")
      .flatMap((condition) => {
        const block = memory.blocks.find((b) => b.id === condition.blockId);
        if (!block) return [];
        const myRole = myRolesByTrade.get(block.tradeId);
        if (!myRole || myRole !== condition.assignedRole) return [];
        const trade = memory.trades.find((t) => t.id === block.tradeId);
        if (!trade) return [];
        return [
          {
            tradeId: trade.id,
            tradeTitle: trade.title,
            blockId: block.id,
            blockTitle: block.title,
            conditionId: condition.id,
            conditionTitle: condition.title,
            assignedRole: condition.assignedRole,
            conditionType: condition.type,
          },
        ];
      });
    return { createdTrades, participantTrades, pendingActions };
  }

  const [createdResult, participantResult, pendingResult] = await Promise.all([
    query<{ id: string; title: string; description: string | null; created_by: string; status: "DRAFT" | "ACTIVE" | "COMPLETED"; created_at: string }>(
      `SELECT id, title, description, created_by, status, created_at
       FROM escrow_mvp_trades
       WHERE created_by = $1
       ORDER BY created_at DESC`,
      [userId]
    ),
    query<{ id: string; title: string; description: string | null; created_by: string; status: "DRAFT" | "ACTIVE" | "COMPLETED"; created_at: string }>(
      `SELECT DISTINCT t.id, t.title, t.description, t.created_by, t.status, t.created_at
       FROM escrow_mvp_trades t
       JOIN escrow_mvp_trade_participants p ON p.trade_id = t.id
       WHERE p.user_id = $1 AND p.status = 'ACCEPTED' AND t.created_by <> $1
       ORDER BY t.created_at DESC`,
      [userId]
    ),
    query<{
      trade_id: string;
      trade_title: string;
      block_id: string;
      block_title: string;
      condition_id: string;
      condition_title: string;
      assigned_role: MvpRole;
      condition_type: ConditionType;
    }>(
      `SELECT
         t.id AS trade_id,
         t.title AS trade_title,
         b.id AS block_id,
         b.title AS block_title,
         c.id AS condition_id,
         c.title AS condition_title,
         c.assigned_role,
         c.type AS condition_type
       FROM escrow_mvp_conditions c
       JOIN escrow_mvp_blocks b ON b.id = c.block_id
       JOIN escrow_mvp_trades t ON t.id = b.trade_id
       JOIN escrow_mvp_trade_participants p
         ON p.trade_id = t.id AND p.user_id = $1 AND p.status = 'ACCEPTED'
       WHERE c.status = 'SUBMITTED'
         AND c.assigned_role = p.role
       ORDER BY t.created_at DESC, b.created_at DESC, c.created_at ASC`,
      [userId]
    ),
  ]);

  const createdTrades = createdResult.rows.map((r) => ({
    id: r.id,
    title: r.title,
    description: r.description,
    createdBy: r.created_by,
    status: r.status,
    createdAt: r.created_at,
  }));
  const participantTrades = participantResult.rows.map((r) => ({
    id: r.id,
    title: r.title,
    description: r.description,
    createdBy: r.created_by,
    status: r.status,
    createdAt: r.created_at,
  }));
  const pendingActions = pendingResult.rows.map((r) => ({
    tradeId: r.trade_id,
    tradeTitle: r.trade_title,
    blockId: r.block_id,
    blockTitle: r.block_title,
    conditionId: r.condition_id,
    conditionTitle: r.condition_title,
    assignedRole: r.assigned_role,
    conditionType: r.condition_type,
  }));
  return { createdTrades, participantTrades, pendingActions };
}

export async function listPendingApprovals(userId: string) {
  const summary = await getDashboardSummary(userId);
  return summary.pendingActions;
}

export async function listMyTasks(userId: string): Promise<
  Array<{
    tradeId: string;
    tradeTitle: string;
    blockId: string;
    blockTitle: string;
    conditionId: string;
    conditionTitle: string;
    assignedRole: MvpRole;
    conditionType: ConditionType;
  }>
> {
  if (!isDatabaseConfigured()) {
    const myRolesByTrade = new Map(
      memory.participants
        .filter((p) => p.userId === userId && p.status === "ACCEPTED")
        .map((p) => [p.tradeId, p.role] as const)
    );
    return memory.conditions
      .filter((c) => c.status === "PENDING")
      .flatMap((condition) => {
        const block = memory.blocks.find((b) => b.id === condition.blockId);
        if (!block) return [];
        const myRole = myRolesByTrade.get(block.tradeId);
        if (!myRole || myRole !== condition.assignedRole) return [];
        const trade = memory.trades.find((t) => t.id === block.tradeId);
        if (!trade) return [];
        return [{
          tradeId: trade.id,
          tradeTitle: trade.title,
          blockId: block.id,
          blockTitle: block.title,
          conditionId: condition.id,
          conditionTitle: condition.title,
          assignedRole: condition.assignedRole,
          conditionType: condition.type,
        }];
      });
  }

  const rows = await query<{
    trade_id: string;
    trade_title: string;
    block_id: string;
    block_title: string;
    condition_id: string;
    condition_title: string;
    assigned_role: MvpRole;
    condition_type: ConditionType;
  }>(
    `SELECT
       t.id AS trade_id,
       t.title AS trade_title,
       b.id AS block_id,
       b.title AS block_title,
       c.id AS condition_id,
       c.title AS condition_title,
       c.assigned_role,
       c.type AS condition_type
     FROM escrow_mvp_conditions c
     JOIN escrow_mvp_blocks b ON b.id = c.block_id
     JOIN escrow_mvp_trades t ON t.id = b.trade_id
     JOIN escrow_mvp_trade_participants p
       ON p.trade_id = t.id AND p.user_id = $1 AND p.status = 'ACCEPTED'
     WHERE c.status = 'PENDING'
       AND c.assigned_role = p.role
     ORDER BY t.created_at DESC, b.created_at DESC, c.created_at ASC`,
    [userId]
  );
  return rows.rows.map((r) => ({
    tradeId: r.trade_id,
    tradeTitle: r.trade_title,
    blockId: r.block_id,
    blockTitle: r.block_title,
    conditionId: r.condition_id,
    conditionTitle: r.condition_title,
    assignedRole: r.assigned_role,
    conditionType: r.condition_type,
  }));
}

export async function getDashboardBadgeCounts(userId: string) {
  const [pendingApprovals, myTasks, finalApprovalWaiting, invites] = await Promise.all([
    listPendingApprovals(userId),
    listMyTasks(userId),
    listFinalApprovalWaiting(userId),
    listDashboardInvites(userId),
  ]);
  return {
    pendingApprovals: pendingApprovals.length,
    myTasks: myTasks.length,
    finalApprovalWaiting: finalApprovalWaiting.length,
    inviteCount: invites.received.length,
  };
}

export async function listFinalApprovalWaiting(userId: string): Promise<
  Array<{
    tradeId: string;
    tradeTitle: string;
    blockId: string;
    blockTitle: string;
    finalApproverRole: MvpRole;
    ready: boolean;
    missingRequiredCount: number;
  }>
> {
  if (!isDatabaseConfigured()) {
    const myRolesByTrade = new Map(
      memory.participants
        .filter((p) => p.userId === userId && p.status === "ACCEPTED")
        .map((p) => [p.tradeId, p.role] as const)
    );
    return memory.blocks
      .filter((b) => b.status === "READY_FOR_FINAL_APPROVAL")
      .flatMap((block) => {
        const myRole = myRolesByTrade.get(block.tradeId);
        if (!myRole || myRole !== block.finalApproverRole) return [];
        const trade = memory.trades.find((t) => t.id === block.tradeId);
        if (!trade) return [];
        return [
          {
            tradeId: trade.id,
            tradeTitle: trade.title,
            blockId: block.id,
            blockTitle: block.title,
            finalApproverRole: block.finalApproverRole,
            ready: true,
            missingRequiredCount: 0,
          },
        ];
      });
  }

  const rows = await query<{
    trade_id: string;
    trade_title: string;
    block_id: string;
    block_title: string;
    final_approver_role: MvpRole;
    missing_required_count: string;
  }>(
    `SELECT
       t.id AS trade_id,
       t.title AS trade_title,
       b.id AS block_id,
       b.title AS block_title,
       b.final_approver_role,
       '0' AS missing_required_count
     FROM escrow_mvp_blocks b
     JOIN escrow_mvp_trades t ON t.id = b.trade_id
     JOIN escrow_mvp_trade_participants p
       ON p.trade_id = b.trade_id AND p.user_id = $1 AND p.status = 'ACCEPTED'
     WHERE b.status = 'READY_FOR_FINAL_APPROVAL'
       AND b.final_approver_role = p.role
     ORDER BY t.created_at DESC, b.created_at DESC`,
    [userId]
  );
  return rows.rows.map((r) => {
    const missingRequiredCount = Number(r.missing_required_count || "0");
    return {
      tradeId: r.trade_id,
      tradeTitle: r.trade_title,
      blockId: r.block_id,
      blockTitle: r.block_title,
      finalApproverRole: r.final_approver_role,
      ready: true,
      missingRequiredCount,
    };
  });
}

export async function listDashboardInvites(userId: string): Promise<{
  received: Array<{
    inviteId: string;
    tradeId: string;
    tradeTitle: string;
    token: string;
    role: MvpRole;
    status: "PENDING" | "ACCEPTED" | "DECLINED";
    inviteTarget: string;
    createdAt: string;
  }>;
  sent: Array<{
    inviteId: string;
    tradeId: string;
    tradeTitle: string;
    token: string;
    role: MvpRole;
    status: "PENDING" | "ACCEPTED" | "DECLINED";
    inviteTarget: string;
    createdAt: string;
  }>;
}> {
  if (!isDatabaseConfigured()) {
    const me = memory.users.find((u) => u.id === userId);
    const meEmail = me?.email ?? "";
    const received = memory.invites.flatMap((invite) => {
      const p = memory.participants.find((x) => x.id === invite.participantId);
      const t = memory.trades.find((x) => x.id === invite.tradeId);
      if (!p || !t) return [];
      const isMine = p.userId === userId || (!!meEmail && p.inviteType === "EMAIL" && p.inviteTarget.toLowerCase() === meEmail.toLowerCase());
      if (!isMine) return [];
      return [{
        inviteId: invite.id,
        tradeId: t.id,
        tradeTitle: t.title,
        token: invite.token,
        role: p.role,
        status: invite.status,
        inviteTarget: p.inviteTarget,
        createdAt: invite.createdAt,
      }];
    });
    const sentInviteIds = new Set(
      memory.logs
        .filter((l) => l.action === "INVITE_CREATED" && l.actorUserId === userId)
        .map((l) => String((l.meta as Record<string, unknown> | null)?.inviteId ?? ""))
        .filter(Boolean)
    );
    const sent = memory.invites.flatMap((invite) => {
      if (!sentInviteIds.has(invite.id)) return [];
      const p = memory.participants.find((x) => x.id === invite.participantId);
      const t = memory.trades.find((x) => x.id === invite.tradeId);
      if (!p || !t) return [];
      return [{
        inviteId: invite.id,
        tradeId: t.id,
        tradeTitle: t.title,
        token: invite.token,
        role: p.role,
        status: invite.status,
        inviteTarget: p.inviteTarget,
        createdAt: invite.createdAt,
      }];
    });
    return { received, sent };
  }

  const me = await query<{ email: string }>("SELECT email FROM escrow_mvp_users WHERE id = $1 LIMIT 1", [userId]);
  const meEmail = me.rows[0]?.email ?? "";

  const [receivedRows, sentRows] = await Promise.all([
    query<{
      invite_id: string;
      trade_id: string;
      trade_title: string;
      token: string;
      role: MvpRole;
      status: "PENDING" | "ACCEPTED" | "DECLINED";
      invite_target: string;
      created_at: string;
    }>(
      `SELECT
         i.id AS invite_id,
         t.id AS trade_id,
         t.title AS trade_title,
         i.token,
         p.role,
         i.status,
         p.invite_target,
         i.created_at
       FROM escrow_mvp_invites i
       JOIN escrow_mvp_trade_participants p ON p.id = i.participant_id
       JOIN escrow_mvp_trades t ON t.id = i.trade_id
       WHERE p.user_id = $1
          OR ($2 <> '' AND p.invite_type = 'EMAIL' AND LOWER(p.invite_target) = LOWER($2))
       ORDER BY i.created_at DESC`,
      [userId, meEmail]
    ),
    query<{
      invite_id: string;
      trade_id: string;
      trade_title: string;
      token: string;
      role: MvpRole;
      status: "PENDING" | "ACCEPTED" | "DECLINED";
      invite_target: string;
      created_at: string;
    }>(
      `SELECT
         i.id AS invite_id,
         t.id AS trade_id,
         t.title AS trade_title,
         i.token,
         p.role,
         i.status,
         p.invite_target,
         i.created_at
       FROM escrow_mvp_invites i
       JOIN escrow_mvp_trade_participants p ON p.id = i.participant_id
       JOIN escrow_mvp_trades t ON t.id = i.trade_id
       JOIN escrow_mvp_audit_logs l
         ON l.trade_id = t.id
        AND l.action = 'INVITE_CREATED'
        AND l.actor_user_id = $1
        AND l.meta->>'inviteId' = i.id
       ORDER BY i.created_at DESC`,
      [userId]
    ),
  ]);

  return {
    received: receivedRows.rows.map((r) => ({
      inviteId: r.invite_id,
      tradeId: r.trade_id,
      tradeTitle: r.trade_title,
      token: r.token,
      role: r.role,
      status: r.status,
      inviteTarget: r.invite_target,
      createdAt: r.created_at,
    })),
    sent: sentRows.rows.map((r) => ({
      inviteId: r.invite_id,
      tradeId: r.trade_id,
      tradeTitle: r.trade_title,
      token: r.token,
      role: r.role,
      status: r.status,
      inviteTarget: r.invite_target,
      createdAt: r.created_at,
    })),
  };
}

export async function getProgressBuckets(userId: string): Promise<{
  active: MvpTrade[];
  completed: MvpTrade[];
  disputedOrOnHold: MvpTrade[];
}> {
  const allTrades = await listMyTrades(userId);
  if (!isDatabaseConfigured()) {
    const completed = allTrades.filter((trade) => {
      const blocks = memory.blocks.filter((b) => b.tradeId === trade.id);
      return blocks.length > 0 && blocks.every((b) => b.status === "APPROVED");
    });
    const active = allTrades.filter((trade) => !completed.some((c) => c.id === trade.id));
    const disputedOrOnHold = allTrades.filter((trade) => {
      const blocks = memory.blocks.filter((b) => b.tradeId === trade.id);
      return blocks.some((b) => b.status === "DISPUTED" || b.status === "ON_HOLD");
    });
    return { active: active.filter((t) => !disputedOrOnHold.some((d) => d.id === t.id)), completed, disputedOrOnHold };
  }

  const rows = await query<{
    trade_id: string;
    all_final_approved: boolean;
    has_disputed_or_on_hold: boolean;
    block_count: string;
  }>(
    `SELECT
       t.id AS trade_id,
       COALESCE(bool_and(b.status = 'APPROVED'), false) AS all_final_approved,
       COALESCE(bool_or(b.status IN ('DISPUTED', 'ON_HOLD')), false) AS has_disputed_or_on_hold,
       COUNT(b.id)::text AS block_count
     FROM escrow_mvp_trades t
     LEFT JOIN escrow_mvp_blocks b ON b.trade_id = t.id
     WHERE t.id = ANY($1::uuid[])
     GROUP BY t.id`,
    [allTrades.map((t) => t.id)]
  );
  const byTrade = new Map(rows.rows.map((r) => [r.trade_id, r]));
  const completed = allTrades.filter((trade) => {
    const row = byTrade.get(trade.id);
    return row && Number(row.block_count || "0") > 0 && row.all_final_approved;
  });
  const disputedOrOnHold = allTrades.filter((trade) => byTrade.get(trade.id)?.has_disputed_or_on_hold);
  const active = allTrades.filter((trade) => !completed.some((c) => c.id === trade.id) && !disputedOrOnHold.some((d) => d.id === trade.id));
  return { active, completed, disputedOrOnHold };
}
