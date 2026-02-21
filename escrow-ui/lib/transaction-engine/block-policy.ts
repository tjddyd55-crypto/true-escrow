import type { ApprovalMode, Block, BlockStatus } from "./types";

export type PolicyTransitionResult = {
  nextStatus: BlockStatus;
  reason?: string;
};

export function isFormallyCompleted(params: { missingRequiredCount: number }): boolean {
  return params.missingRequiredCount === 0;
}

export function isAutoEligible(params: { approvalMode: ApprovalMode; hasAttachmentQuestion: boolean }): boolean {
  if (params.approvalMode !== "AUTO_RELEASE") return true;
  return !params.hasAttachmentQuestion;
}

function getTimeoutMs(reviewTimeoutHours?: number): number {
  const hours = Math.max(1, Number(reviewTimeoutHours ?? 48));
  return hours * 60 * 60 * 1000;
}

function hasTimedOut(block: Block, now: Date): boolean {
  if (!block.submittedAt) return false;
  const elapsed = now.getTime() - new Date(block.submittedAt).getTime();
  return elapsed >= getTimeoutMs(block.reviewTimeoutHours);
}

export function evaluateBlockTransition(params: {
  block: Block;
  now: Date;
  formallyCompleted: boolean;
  autoEligible: boolean;
}): PolicyTransitionResult {
  const { block, now, formallyCompleted, autoEligible } = params;
  const dueDatePassed = block.dueDate < now.toISOString().slice(0, 10);

  if (["APPROVED", "REJECTED", "DISPUTED", "CANCELLED"].includes(block.status)) {
    return { nextStatus: block.status };
  }

  if (!formallyCompleted && dueDatePassed && ["IN_PROGRESS", "EXTENDED"].includes(block.status)) {
    return { nextStatus: "OVERDUE", reason: "Due date passed before formal completion" };
  }

  if (formallyCompleted && ["IN_PROGRESS", "EXTENDED", "OVERDUE"].includes(block.status)) {
    return { nextStatus: "SUBMITTED", reason: "Required questions are completed" };
  }

  if (block.status === "SUBMITTED") {
    if (block.approvalMode === "AUTO_RELEASE") {
      if (!autoEligible) return { nextStatus: "SUBMITTED", reason: "AUTO_RELEASE forbidden with attachments" };
      return { nextStatus: "APPROVED", reason: "AUTO_RELEASE policy" };
    }
    if (block.approvalMode === "MANUAL_REVIEW_REQUIRED") {
      return { nextStatus: "REVIEWING" };
    }
    if (block.approvalMode === "AUTO_APPROVE_THEN_RELEASE") {
      return hasTimedOut(block, now)
        ? { nextStatus: "APPROVED", reason: "Auto-approve timeout reached" }
        : { nextStatus: "REVIEWING" };
    }
    if (block.approvalMode === "AUTO_DISPUTE_IF_NO_RESPONSE") {
      return hasTimedOut(block, now)
        ? { nextStatus: "DISPUTED", reason: "Auto-dispute timeout reached" }
        : { nextStatus: "REVIEWING" };
    }
  }

  if (block.status === "REVIEWING") {
    if (block.approvalMode === "AUTO_APPROVE_THEN_RELEASE" && hasTimedOut(block, now)) {
      return { nextStatus: "APPROVED", reason: "Auto-approve timeout reached" };
    }
    if (block.approvalMode === "AUTO_DISPUTE_IF_NO_RESPONSE" && hasTimedOut(block, now)) {
      return { nextStatus: "DISPUTED", reason: "Auto-dispute timeout reached" };
    }
  }

  return { nextStatus: block.status };
}
