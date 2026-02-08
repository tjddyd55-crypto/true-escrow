"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import type { TransactionGraph } from "@/lib/transaction-engine/types";
import { BlockSummary } from "@/components/BlockSummary";
import { TransactionCalendar } from "@/components/TransactionCalendar";

function StatusBadge({ status }: { status: string }) {
  const style =
    status === "PENDING"
      ? { bg: "#dc2626", label: "제출 필요" }
      : status === "SUBMITTED"
        ? { bg: "#6b7280", label: "대기" }
        : status === "APPROVED"
          ? { bg: "#059669", label: "완료" }
          : status === "REJECTED"
            ? { bg: "#dc2626", label: "수정 필요" }
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

export default function TransactionSellerViewPage() {
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

  async function submitWorkItem(itemId: string) {
    try {
      const res = await fetch(`/api/engine/workitems/${itemId}/submit`, { method: "POST" });
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
  const toSubmitItems = graph.workItems.filter((wi) => wi.status === "PENDING");
  const revisionRequests = graph.workItems.filter((wi) => wi.status === "REJECTED");
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
            variant="seller"
            txStartDate={txStart}
          />
        </div>
      )}

      {/* Main: Left = My Actions, Right = Calendar */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 24, alignItems: "start" }}>
        <div style={{ flex: "1 1 300px", minWidth: 0 }}>
          <h2 style={{ fontSize: "1.1rem", marginBottom: 12 }}>My Actions</h2>

          {/* A. To Submit */}
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: "0.95rem", marginBottom: 8, color: "#333" }}>To Submit</h3>
            {toSubmitItems.length === 0 ? (
              <p style={{ fontSize: "0.9rem", color: "#666" }}>No items due for submission right now.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {toSubmitItems.map((item) => {
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
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
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
                            style={{
                              padding: "6px 12px",
                              backgroundColor: "#f3f4f6",
                              color: "#374151",
                              border: "1px solid #d1d5db",
                              borderRadius: 6,
                              cursor: "pointer",
                              fontSize: "0.85rem",
                            }}
                          >
                            Upload File
                          </button>
                          <button
                            type="button"
                            onClick={() => submitWorkItem(item.id)}
                            style={{
                              padding: "6px 14px",
                              backgroundColor: "#7c3aed",
                              color: "white",
                              border: "none",
                              borderRadius: 6,
                              cursor: "pointer",
                              fontWeight: "600",
                              fontSize: "0.85rem",
                            }}
                          >
                            Submit
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* B. Revision Requests (REJECTED) */}
          {revisionRequests.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: "0.95rem", marginBottom: 8, color: "#333" }}>Revision Requests</h3>
              <p style={{ fontSize: "0.85rem", color: "#666", marginBottom: 8 }}>Buyer requested changes. Please update and resubmit.</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {revisionRequests.map((item) => {
                  const rule = graph.workRules.find((r) => r.id === item.workRuleId);
                  const block = rule ? graph.blocks.find((b) => b.id === rule.blockId) : null;
                  return (
                    <div
                      key={item.id}
                      style={{
                        padding: 14,
                        border: "1px solid #fecaca",
                        borderRadius: 8,
                        backgroundColor: "#fef2f2",
                        borderLeft: "4px solid #dc2626",
                      }}
                    >
                      <span style={{ fontWeight: "600" }}>{rule?.title || rule?.workType || "Work"}</span>
                      {block && <span style={{ fontSize: "0.85rem", color: "#666", marginLeft: 8 }}>({block.title})</span>}
                      <div style={{ marginTop: 6 }}>
                        <StatusBadge status="REJECTED" />
                      </div>
                      <p style={{ marginTop: 8, fontSize: "0.85rem", color: "#666" }}>Comment: (no comment stored yet)</p>
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
