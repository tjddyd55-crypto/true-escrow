export type MvpRole = "BUYER" | "SELLER" | "VERIFIER";
export type InviteType = "EMAIL" | "PHONE";
export type InviteStatus = "PENDING" | "ACCEPTED" | "DECLINED";
export type ParticipantStatus = "INVITED" | "ACCEPTED" | "DECLINED";
export type ConditionType = "CHECK" | "FILE_UPLOAD" | "TEXT" | "NUMBER" | "DATE";
export type ConditionStatus = "PENDING" | "SUBMITTED" | "CONFIRMED" | "REJECTED";
export type BlockStatus =
  | "DRAFT"
  | "IN_PROGRESS"
  | "READY_FOR_FINAL_APPROVAL"
  | "APPROVED"
  | "DISPUTED"
  | "ON_HOLD";
export type TradeStatus = "DRAFT" | "ACTIVE" | "COMPLETED";
export type ApprovalType = "MANUAL" | "SIMPLE";
export type AuditAction =
  | "INVITE_CREATED"
  | "INVITE_ACCEPTED"
  | "CONDITION_SUBMITTED"
  | "CONDITION_REJECTED"
  | "CONDITION_RESUBMITTED"
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
  status: TradeStatus;
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
  startDate?: string | null;
  dueDate: string;
  approvalType: ApprovalType;
  finalApproverRole: MvpRole;
  watchers: MvpRole[];
  extendedDueDate?: string | null;
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
  confirmerRole: MvpRole;
  status: ConditionStatus;
  rejectReason?: string | null;
  rejectedBy?: string | null;
  rejectedAt?: string | null;
  resubmittedAt?: string | null;
  submittedAt?: string | null;
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
