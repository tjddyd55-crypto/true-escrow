export type MvpRole = "BUYER" | "SELLER" | "VERIFIER";
export type InviteType = "EMAIL" | "PHONE";
export type InviteStatus = "PENDING" | "ACCEPTED" | "DECLINED";
export type ParticipantStatus = "INVITED" | "ACCEPTED" | "DECLINED";
export type ConditionType = "CHECK" | "FILE";
export type ConditionStatus = "PENDING" | "CONFIRMED";
export type BlockStatus = "DRAFT" | "OPEN" | "FINAL_APPROVED";
export type AuditAction =
  | "INVITE_CREATED"
  | "INVITE_ACCEPTED"
  | "CONDITION_CONFIRMED"
  | "BLOCK_FINAL_APPROVED";

export type MvpUser = {
  id: string;
  email: string;
  passwordHash: string;
  name?: string | null;
  createdAt: string;
};

export type MvpTrade = {
  id: string;
  title: string;
  description?: string | null;
  createdBy: string;
  createdAt: string;
};

export type MvpParticipant = {
  id: string;
  tradeId: string;
  userId?: string | null;
  role: MvpRole;
  status: ParticipantStatus;
  inviteType: InviteType;
  inviteTarget: string;
  createdAt: string;
};

export type MvpInvite = {
  id: string;
  tradeId: string;
  participantId: string;
  token: string;
  status: InviteStatus;
  createdAt: string;
};

export type MvpBlock = {
  id: string;
  tradeId: string;
  title: string;
  dueAt: string;
  finalApproverRole: MvpRole;
  status: BlockStatus;
  createdAt: string;
};

export type MvpCondition = {
  id: string;
  blockId: string;
  title: string;
  description?: string | null;
  type: ConditionType;
  required: boolean;
  assignedRole: MvpRole;
  status: ConditionStatus;
  confirmedBy?: string | null;
  confirmedAt?: string | null;
  createdAt: string;
};

export type MvpAuditLog = {
  id: string;
  tradeId: string;
  action: AuditAction;
  actorUserId?: string | null;
  meta?: Record<string, unknown> | null;
  createdAt: string;
};
