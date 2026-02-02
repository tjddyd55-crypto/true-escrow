/**
 * Canonical keys - MUST remain English-only in code
 * These are the keys used in API responses and internal logic
 */

export type DealState = 
  | "CREATED"
  | "FUNDED"
  | "DELIVERED"
  | "INSPECTION"
  | "APPROVED"
  | "ISSUE"
  | "SETTLED";

export type TimerKey = 
  | "AUTO_APPROVE"
  | "DISPUTE_TTL"
  | "HOLDBACK_RELEASE";

export type IssueReasonCode = 
  | "NOT_DELIVERED"
  | "DAMAGE_MAJOR"
  | "DAMAGE_MINOR"
  | "MISSING_PARTS"
  | "QUALITY_NOT_MATCHING"
  | "DOCUMENT_MISMATCH"
  | "OTHER";

export type LedgerEntryType = 
  | "HOLD"
  | "RELEASE"
  | "REFUND"
  | "OFFSET";

export type DealCategory = 
  | "CAR"
  | "REAL_ESTATE_RENTAL"
  | "REAL_ESTATE_SALE"
  | "HIGH_VALUE_USED"
  | "B2B_DELIVERY"
  | "USED_CAR_PRIVATE"
  | "USED_CAR_DEALER";

export type Role = 
  | "BUYER"
  | "SELLER"
  | "OPERATOR"
  | "INSPECTOR";

export type Locale = "ko" | "en";

/**
 * Translation keys structure
 */
export interface TranslationKeys {
  states: Record<DealState, string>;
  timers: Record<TimerKey, string>;
  timerExplanations: Record<TimerKey, string>;
  reasonCodes: Record<IssueReasonCode, string>;
  ledgerTypes: Record<LedgerEntryType, string>;
  actions: {
    fundDeal: string;
    markDelivered: string;
    approve: string;
    raiseIssue: string;
    uploadEvidence: string;
    resolveDispute: string;
    viewTimeline: string;
    viewLedger: string;
  };
  ui: {
    timeline: string;
    evidence: string;
    moneySummary: string;
    ledger: string;
    immediateAmount: string;
    holdbackAmount: string;
    totalAmount: string;
    waitingFor: string;
    noActionsAvailable: string;
  };
  money: {
    willBeReleasedAt: string;
    heldInEscrow: string;
    releasedToSeller: string;
    willBeReleasedAutomatically: string;
    mayBeOffset: string;
  };
}
