/**
 * Activity Log System
 */

import type { ActivityLog, ApproverRole } from "./types";

let logs: ActivityLog[] = [];

export function appendLog(
  transactionId: string,
  actorRole: ApproverRole | "ADMIN",
  action: string,
  meta?: Record<string, any>
): ActivityLog {
  const log: ActivityLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    transactionId,
    actorRole,
    action,
    meta,
    timestamp: new Date().toISOString(),
  };
  logs.push(log);
  return log;
}

export function listLogs(transactionId: string): ActivityLog[] {
  return logs.filter((log) => log.transactionId === transactionId);
}

export function clearLogs(): void {
  logs = [];
}
