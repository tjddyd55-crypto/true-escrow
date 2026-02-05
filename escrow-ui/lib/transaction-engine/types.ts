/**
 * Transaction Engine Types - Single Source of Truth
 */

export type TransactionStatus = "DRAFT" | "ACTIVE" | "PAUSED" | "COMPLETED";
export type ApprovalPolicyType = "SINGLE" | "ALL" | "ANY" | "THRESHOLD";
export type ApproverRole = "BUYER" | "SELLER" | "VERIFIER";
export type WorkFrequency = "ONCE" | "DAILY" | "WEEKLY" | "CUSTOM";
export type WorkItemStatus = "PENDING" | "SUBMITTED" | "APPROVED" | "REJECTED";

export type Transaction = {
  id: string;
  title: string;
  description?: string;
  initiatorId: string;
  initiatorRole: "BUYER" | "SELLER";
  status: TransactionStatus;
  createdAt: string;
  buyerId?: string;
  sellerId?: string;
};

export type Block = {
  id: string;
  transactionId: string;
  title: string;
  startDay: number;
  endDay: number;
  orderIndex: number;
  approvalPolicyId: string;
  isActive: boolean;
};

export type ApprovalPolicy = {
  id: string;
  type: ApprovalPolicyType;
  threshold?: number;
};

export type BlockApprover = {
  id: string;
  blockId: string;
  role: ApproverRole;
  userId?: string;
  required: boolean;
};

export type WorkRule = {
  id: string;
  blockId: string;
  workType: string;
  description?: string;
  quantity: number;
  frequency: WorkFrequency;
  dueDates: number[]; // Day numbers
};

export type WorkItem = {
  id: string;
  workRuleId: string;
  dueDay: number; // Day number
  status: WorkItemStatus;
  submittedAt?: string;
};

export type TransactionGraph = {
  transaction: Transaction;
  blocks: Block[];
  approvalPolicies: ApprovalPolicy[];
  blockApprovers: BlockApprover[];
  workRules: WorkRule[];
  workItems: WorkItem[];
};

export type ActivityLog = {
  id: string;
  transactionId: string;
  actorRole: ApproverRole | "ADMIN";
  action: string;
  meta?: Record<string, any>;
  timestamp: string;
};
