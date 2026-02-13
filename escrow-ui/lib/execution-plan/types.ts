/**
 * Execution Plan Document Model (read-only view of a transaction for Preview + PDF).
 * 공통 DocumentModel: Preview(HTML)와 PDF가 동일한 모델 사용.
 */

export type ExecutionPlanDoc = {
  generatedAtISO: string;
  transaction: {
    id: string;
    title: string;
    description?: string;
    startDateISO?: string;
    endDateISO?: string;
    parties?: { buyerId?: string; sellerId?: string };
  };
  summary: {
    totalDays?: number;
    blockCount: number;
  };
  timeline: Array<{
    kind: "START" | "BLOCK" | "PAYOUT" | "END";
    /** Display title (i18n key or plain text; render with tKey/translate). */
    title: string;
    dateStartISO?: string;
    dateEndISO?: string;
    durationDays?: number;
    gapFromPrevDays?: number;
    /** Role codes for translation: BUYER → executionPlan.approvalBuyer */
    approvalRoles?: string[];
    conditions?: string[];
    /** Code for translation: FULL | RATIO:30 | FIXED:100000 | NONE | UNSET */
    payoutRule?: string;
    notes?: string[];
  }>;
  disclaimerLines: string[];
};
