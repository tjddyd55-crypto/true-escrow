/**
 * ExecutionPlanDoc → full HTML string (inline CSS).
 * Same content as Preview; can be used for HTML→PDF or email.
 * PDF API currently uses pdfkit from doc directly (Railway-friendly).
 */

import type { ExecutionPlanDoc } from "./types";

function escape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function renderExecutionPlanHtml(doc: ExecutionPlanDoc): string {
  const { transaction, summary, timeline, disclaimerLines } = doc;

  const parts: string[] = [];
  parts.push(`<!DOCTYPE html><html lang="ko"><head><meta charset="utf-8"><title>${escape(transaction.title)} - Execution Plan</title></head><body style="font-family:sans-serif;max-width:720px;margin:0 auto;padding:24px;color:#111;">`);
  parts.push(`<h1 style="font-size:1.5rem;margin:0 0 8px;">Execution Plan</h1>`);
  parts.push(`<p style="margin:0 0 16px;color:#555;">${escape(transaction.title)}</p>`);
  if (transaction.description) {
    parts.push(`<p style="margin:0 0 16px;">${escape(transaction.description)}</p>`);
  }
  parts.push(`<div style="padding:16px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;margin-bottom:24px;font-size:0.875rem;">`);
  if (transaction.startDateISO && transaction.endDateISO) {
    parts.push(`<p style="margin:0 0 8px;">Period: ${escape(transaction.startDateISO)} – ${escape(transaction.endDateISO)}${summary.totalDays != null ? ` (${summary.totalDays} days)` : ""}</p>`);
  }
  parts.push(`<p style="margin:0;">Blocks: ${summary.blockCount}</p>`);
  if (transaction.parties?.buyerId || transaction.parties?.sellerId) {
    parts.push(`<p style="margin:0;">Parties: ${escape([transaction.parties.buyerId, transaction.parties.sellerId].filter(Boolean).join(", "))}</p>`);
  }
  parts.push(`</div>`);
  parts.push(`<h2 style="font-size:1.125rem;margin-bottom:16px;">Timeline</h2>`);
  parts.push(`<div style="position:relative;padding-left:24px;border-left:2px solid #e5e7eb;">`);

  for (const item of timeline) {
    if (item.gapFromPrevDays != null && item.gapFromPrevDays > 0) {
      parts.push(`<p style="margin:0 0 8px 8px;font-size:0.875rem;color:#666;">(${item.gapFromPrevDays} days elapsed)</p>`);
    }
    const title = item.kind === "START" ? "Transaction start" : item.kind === "END" ? "Transaction end" : escape(item.title);
    const range = item.dateStartISO && item.dateEndISO ? `${escape(item.dateStartISO)} – ${escape(item.dateEndISO)}` : item.dateStartISO ?? item.dateEndISO ?? "";
    parts.push(`<div style="margin-bottom:16px;padding:12px 16px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;">`);
    parts.push(`<div style="font-weight:600;margin-bottom:4px;">${title}</div>`);
    if (range) {
      parts.push(`<div style="font-size:0.875rem;color:#64748b;">${range}${item.durationDays != null ? ` · ${item.durationDays} days` : ""}</div>`);
    }
    if (item.kind === "BLOCK") {
      if (item.approvalRoles?.length) parts.push(`<div style="font-size:0.875rem;margin-top:6px;">Approvals: ${escape(item.approvalRoles.join(", "))}</div>`);
      if (item.conditions?.length) parts.push(`<div style="font-size:0.875rem;">Conditions: ${escape(item.conditions.join(", "))}</div>`);
      if (item.payoutRule) parts.push(`<div style="font-size:0.875rem;">Payout: ${escape(item.payoutRule)}</div>`);
    }
    parts.push(`</div>`);
  }

  parts.push(`</div>`);
  parts.push(`<div style="margin-top:32px;padding:16px;font-size:0.8125rem;color:#64748b;border-top:1px solid #e2e8f0;">`);
  for (const line of disclaimerLines) {
    parts.push(`<p style="margin:4px 0;">${escape(line)}</p>`);
  }
  parts.push(`</div></body></html>`);
  return parts.join("");
}
