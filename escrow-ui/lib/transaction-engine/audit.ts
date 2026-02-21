import type { ApproverRole } from "./types";
import { appendLog } from "./log";

export type BlockAuditAction =
  | "SUBMIT"
  | "APPROVE"
  | "REJECT"
  | "EXTEND"
  | "DISPUTE"
  | "CANCEL"
  | "AUTO_TRANSITION";

export function recordAuditEvent(params: {
  transactionId: string;
  blockId: string;
  action: BlockAuditAction;
  actor: ApproverRole | "ADMIN";
  meta?: Record<string, unknown>;
}): void {
  appendLog(params.transactionId, params.actor, `BLOCK_${params.action}`, {
    blockId: params.blockId,
    ...(params.meta ?? {}),
  });
}
