"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import type { TransactionGraph } from "@/lib/transaction-engine/types";
import { BlockSummary } from "@/components/BlockSummary";
import { TransactionCalendar } from "@/components/TransactionCalendar";

function StatusBadge({ status }: { status: string }) {
  const style =
    status === "SUBMITTED"
      ? { bg: "#dc2626", label: "승인 필요" }
      : status === "PENDING"
        ? { bg: "#6b7280", label: "대기" }
        : status === "APPROVED"
          ? { bg: "#059669", label: "완료" }
          : status === "REJECTED"
            ? { bg: "#6b7280", label: "수정 요청" }
            : { bg: "#6b7280", label: status };
  return (
    <span
      style={{
        padding: "2px 8px",
        borderRadius: 4,
        fontSize: "0.75rem",
        fontWeight: "600",
        backgroundColor: style.bg,
        color: "white",
      }}
    >
      {style.label}
    </span>
  );
}

export default function TransactionBuyerViewPage() {
  const params = useParams();
  const transactionId = params.id as string;
  const [graph, setGraph] = useState<TransactionGraph | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (transactionId) fetchData();
  }, [transactionId]);

  async function fetchData() {
    try {
      const res = await fetch(`/api/engine/transactions/${transactionId}`);
      if (res.ok) {
        const json = await res.json();
        if (json.ok && json.data) setGraph(json.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function approveWorkItem(itemId: string) {
    try {
      const res = await fetch(`/api/engine/workitems/${itemId}/approve`, { method: "POST" });
      if (res.ok) await fetchData();
    } catch (e) {
      console.error(e);
    }
  }

  async function rejectWorkItem(itemId: string) {
    try {
      const res = await fetch(`/api/engine/workitems/${itemId}/reject`, { method: "POST" });
      if (res.ok) await fetchData();
    } catch (e) {
      console.error(e);
    }
  }

  if (loading) return <div style={{ padding: 40 }}>Loading…</div>;
  if (!graph) return <div style={{ padding: 40 }}>Transaction not found</div>;

  const tx = graph.transaction;
  const txStart = tx.startDate ?? "";
  const txEnd = tx.endDate ?? "";
  const currentBlock = graph.blocks.find((b) => b.isActive);
  const currentBlockWorkItems =
    currentBlock ? graph.workItems.filter((wi) => graph.workRules.some((r) => r.id === wi.workRuleId && r.blockId === currentBlock.id)) : [];
  const pendingApprovals = graph.workItems.filter((wi) => wi.status === "SUBMITTED");
  const rejectedItems = graph.workItems.filter((wi) => wi.status === "REJECTED");
  const policyForBlock = currentBlock ? graph.approvalPolicies.find((p) => p.id === currentBlock.approvalPolicyId) : null;
  const approversForBlock = currentBlock ? graph.blockApprovers.filter((a) => a.blockId === currentBlock.id) : [];

  return (
    <main style={{ padding: "24px 20px", maxWidth: 1200, margin: "0 auto" }}>
      <Link href="/transactions" style={{ color: "#0070f3", textDecoration: "none", marginBottom: 16, display: "inline-block" }}>
        ← Back to Transactions
      </Link>

      {/* Transaction Header */}
      <div style={{ marginBottom: 20, padding: 16, border: "1px solid #e0e0e0", borderRadius: 8, backgroundColor: "#fafafa" }}>
        <h1 style={{ fontSize: "1.5rem", margin: "0 0 8px 0" }}>{tx.title}</h1>
        <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap", fontSize: "0.9rem", color: "#666" }}>
          <span style={{ fontWeight: "600", color: "#111" }}>Status: {tx.status}</span>
          <span>Period: {txStart && txEnd ? `${txStart} ~ ${txEnd}` : "—"}</span>
        </div>
      </div>

      {/* Current Block Summary */}
      {currentBlock && (
        <div style={{ marginBottom: 24 }}>
          <BlockSummary
            block={currentBlock}
            approvalPolicy={policyForBlock ?? null}
            approvers={approversForBlock}
            blockWorkItems={currentBlockWorkItems}
            variant="buyer"
            txStartDate={txStart}
          />
        </div>
      )}

      {/* Main: Left = My Actions, Right = Calendar */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 24, alignItems: "start" }}>
        <div style={{ flex: "1 1 300px", minWidth: 0 }}>
          <h2 style={{ fontSize: "1.1rem", marginBottom: 12 }}>My Actions</h2>

          {/* A. Pending Approvals */}
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: "0.95rem", marginBottom: 8, color: "#333" }}>Pending Approvals</h3>
            {pendingApprovals.length === 0 ? (
              <p style={{ fontSize: "0.9rem", color: "#666" }}>No items waiting for your approval.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {pendingApprovals.map((item) => {
                  const rule = graph.workRules.find((r) => r.id === item.workRuleId);
                  const block = rule ? graph.blocks.find((b) => b.id === rule.blockId) : null;
                  return (
                    <div
                      key={item.id}
                      style={{
                        padding: 14,
                        border: "1px solid #e0e0e0",
                        borderRadius: 8,
                        backgroundColor: "#fff",
                        borderLeft: "4px solid #dc2626",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
                        <div>
                          <span style={{ fontWeight: "600" }}>{rule?.title || rule?.workType || "Work"}</span>
                          {block && <span style={{ fontSize: "0.85rem", color: "#666", marginLeft: 8 }}>({block.title})</span>}
                          <div style={{ marginTop: 6 }}>
                            <StatusBadge status={item.status} />
                            <span style={{ fontSize: "0.85rem", color: "#666", marginLeft: 8 }}>Due: Day {item.dueDay}</span>
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button
                            type="button"
                            onClick={() => rejectWorkItem(item.id)}
                            style={{
                              padding: "6px 12px",
                              backgroundColor: "#fef2f2",
                              color: "#dc2626",
                              border: "1px solid #dc2626",
                              borderRadius: 6,
                              cursor: "pointer",
                              fontWeight: "600",
                              fontSize: "0.85rem",
                            }}
                          >
                            Request Revision
                          </button>
                          <button
                            type="button"
                            onClick={() => approveWorkItem(item.id)}
                            style={{
                              padding: "6px 14px",
                              backgroundColor: "#059669",
                              color: "white",
                              border: "none",
                              borderRadius: 6,
                              cursor: "pointer",
                              fontWeight: "600",
                              fontSize: "0.85rem",
                            }}
                          >
                            Approve
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* B. Revision requests (rejected) — Buyer sees "수정 요청" */}
          {rejectedItems.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: "0.95rem", marginBottom: 8, color: "#333" }}>Revision Requests</h3>
              <p style={{ fontSize: "0.85rem", color: "#666" }}>You requested revision. Waiting for seller to resubmit.</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
                {rejectedItems.map((item) => {
                  const rule = graph.workRules.find((r) => r.id === item.workRuleId);
                  const block = rule ? graph.blocks.find((b) => b.id === rule.blockId) : null;
                  return (
                    <div key={item.id} style={{ padding: 10, border: "1px solid #e0e0e0", borderRadius: 6, backgroundColor: "#f9fafb" }}>
                      <span style={{ fontWeight: "600" }}>{rule?.title || rule?.workType || "Work"}</span>
                      {block && <span style={{ fontSize: "0.85rem", color: "#666", marginLeft: 8 }}>({block.title})</span>}
                      <div style={{ marginTop: 4 }}>
                        <StatusBadge status="REJECTED" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right: Transaction Calendar (read-only) */}
        <div style={{ flex: "0 0 380px", minWidth: 280, position: "sticky", top: 16 }}>
          <h2 style={{ fontSize: "1rem", marginBottom: 10 }}>Timeline</h2>
          {txStart && txEnd && (
            <TransactionCalendar
              txStartDate={txStart}
              txEndDate={txEnd}
              blocks={graph.blocks}
              approvalPolicies={graph.approvalPolicies}
              blockApprovers={graph.blockApprovers}
              highlightToday
              highlightCurrentBlock
            />
          )}
        </div>
      </div>
    </main>
  );
}
