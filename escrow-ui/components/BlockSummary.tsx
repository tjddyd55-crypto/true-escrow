"use client";

import type { Block, ApprovalPolicy, BlockApprover, WorkItem } from "@/lib/transaction-engine/types";
import { daysBetween, formatShortRange } from "@/lib/transaction-engine/dateUtils";

type Props = {
  block: Block;
  approvalPolicy?: ApprovalPolicy | null;
  approvers: BlockApprover[];
  /** Work items that belong to this block only */
  blockWorkItems: WorkItem[];
  variant: "buyer" | "seller";
  txStartDate?: string;
};

export function BlockSummary({ block, approvalPolicy, approvers, blockWorkItems, variant, txStartDate }: Props) {
  const approvedCount = blockWorkItems.filter((i) => i.status === "APPROVED").length;
  const totalCount = blockWorkItems.length;
  const pendingItems = blockWorkItems.filter((i) => i.status === "PENDING").sort((a, b) => (a.dueDay ?? 0) - (b.dueDay ?? 0));
  const nextDue = pendingItems[0];
  const daysUntilDue =
    txStartDate && nextDue?.dueDay != null
      ? (() => {
          const start = new Date(txStartDate + "T12:00:00Z").getTime();
          const dueDate = new Date(start);
          dueDate.setUTCDate(dueDate.getUTCDate() + (nextDue.dueDay - 1));
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          dueDate.setHours(0, 0, 0, 0);
          return Math.ceil((dueDate.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
        })()
      : null;

  return (
    <section
      style={{
        padding: 20,
        borderRadius: 8,
        border: "1px solid #e0e0e0",
        backgroundColor: variant === "buyer" ? "#f0f9ff" : "#f0fdf4",
        borderColor: variant === "buyer" ? "#bae6fd" : "#bbf7d0",
      }}
    >
      <h2 style={{ fontSize: "1rem", margin: "0 0 12px 0", fontWeight: "600" }}>Current Block</h2>
      <div style={{ fontWeight: "600", marginBottom: 4 }}>{block.title}</div>
      <div style={{ fontSize: "0.9rem", color: "#666", marginBottom: 8 }}>
        {formatShortRange(block.startDate, block.endDate)} ({daysBetween(block.startDate, block.endDate)} days)
      </div>
      <div style={{ fontSize: "0.85rem", color: "#555", marginBottom: 6 }}>
        Approval: {approvalPolicy?.type ?? "—"} ({approvers.length} approver{approvers.length !== 1 ? "s" : ""})
      </div>
      {variant === "buyer" && totalCount > 0 && (
        <div style={{ fontSize: "0.85rem", fontWeight: "600", color: "#0d9488" }}>
          Approval progress: {approvedCount} / {totalCount} approved
        </div>
      )}
      {variant === "seller" && nextDue && daysUntilDue != null && (
        <div style={{ fontSize: "0.85rem", fontWeight: "600", color: "#ca8a04" }}>
          Next deadline: D-{daysUntilDue} (Day {nextDue.dueDay})
        </div>
      )}
    </section>
  );
}
