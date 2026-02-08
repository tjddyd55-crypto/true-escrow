/**
 * Transaction Engine Types - Single Source of Truth
 */

export type TransactionStatus = "DRAFT" | "ACTIVE" | "PAUSED" | "COMPLETED";
export type ApprovalPolicyType = "SINGLE" | "ALL" | "ANY" | "THRESHOLD";
export type ApproverRole = "BUYER" | "SELLER" | "VERIFIER" | "ADMIN";
export type WorkRuleType = "BLOG" | "CUSTOM" | "REVIEW" | "SIGN_OFF" | "DELIVERY" | "DOCUMENT" | "INSPECTION";
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
  /** Absolute time: transaction period (calendar dates). Set once at creation. */
  startDate?: string; // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD
};

export type Block = {
  id: string;
  transactionId: string;
  title: string;
  /** Segment time: block period (calendar dates). Duration = derived. */
  startDate: string; // YYYY-MM-DD
  endDate: string;  // YYYY-MM-DD
  orderIndex: number;
  approvalPolicyId: string;
  isActive: boolean;
};

/** Timeline segment: real block or system-generated gap (neutral empty time; no meaning, no rules). */
export type TimelineSegment =
  | { type: "block"; block: Block }
  | { type: "gap"; startDate: string; endDate: string };

/** Single day in calendar: BLOCK or IDLE (for timeline visualization). SSOT for calendar cell. */
export type CalendarDay = {
  date: string;
  inTransaction: boolean;
  type: "BLOCK" | "IDLE";
  blockId?: string;
  blockTitle?: string;
  blockIndex?: number;
  color?: string;
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
  /** Rule type (enum); used for categorization. */
  workType: WorkRuleType;
  /** Editable display title for the rule. */
  title?: string;
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
