"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import type {
  TransactionGraph,
  Transaction,
  Block,
  ApprovalPolicy,
  BlockApprover,
  WorkRule,
  WorkItem,
  ActivityLog,
} from "@/lib/transaction-engine/types";

export default function TransactionBuilderPage() {
  const params = useParams();
  const transactionId = params.id as string;
  const [graph, setGraph] = useState<TransactionGraph | null>(null);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingBlock, setEditingBlock] = useState<string | null>(null);
  const [editingWorkRule, setEditingWorkRule] = useState<string | null>(null);

  useEffect(() => {
    if (transactionId) {
      fetchData();
    }
  }, [transactionId]);

  async function fetchData() {
    try {
      console.log("[Frontend] Fetching transaction:", transactionId);
      const [txRes, logsRes] = await Promise.all([
        fetch(`/api/engine/transactions/${transactionId}`),
        fetch(`/api/engine/logs/${transactionId}`),
      ]);

      if (txRes.ok) {
        const txData = await txRes.json();
        console.log("[Frontend] Transaction data received:", txData);
        if (txData.ok && txData.data) {
          setGraph(txData.data);
        } else {
          console.error("[Frontend] Invalid transaction data:", txData);
        }
      } else {
        const errorData = await txRes.json();
        console.error("[Frontend] Failed to fetch transaction:", errorData);
      }
      if (logsRes.ok) {
        const logsData = await logsRes.json();
        setLogs(logsData.data || []);
      }
    } catch (error) {
      console.error("[Frontend] Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function updateTransaction(patch: Partial<Transaction>) {
    if (!graph || graph.transaction.status !== "DRAFT") return;

    try {
      const res = await fetch(`/api/engine/transactions/${transactionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (res.ok) {
        fetchData();
      }
    } catch (error) {
      console.error("Failed to update transaction:", error);
    }
  }

  async function addBlock() {
    if (!graph || graph.transaction.status !== "DRAFT") return;

    const orderIndex = graph.blocks.length + 1;
    const startDay = graph.blocks.length > 0 
      ? Math.max(...graph.blocks.map((b) => b.endDay)) + 1 
      : 1;
    const endDay = startDay + 6;

    try {
      const res = await fetch("/api/engine/blocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactionId,
          title: `Block ${orderIndex}`,
          startDay,
          endDay,
          orderIndex,
          approvalType: "SINGLE",
        }),
      });
      if (res.ok) {
        fetchData();
      }
    } catch (error) {
      console.error("Failed to add block:", error);
    }
  }

  async function updateBlock(blockId: string, patch: Partial<Block>) {
    if (!graph || graph.transaction.status !== "DRAFT") return;

    try {
      const res = await fetch("/api/engine/blocks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: blockId, patch }),
      });
      if (res.ok) {
        fetchData();
      }
    } catch (error) {
      console.error("Failed to update block:", error);
    }
  }

  async function deleteBlock(blockId: string) {
    if (!graph || graph.transaction.status !== "DRAFT") return;

    try {
      const res = await fetch(`/api/engine/blocks?id=${blockId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchData();
      }
    } catch (error) {
      console.error("Failed to delete block:", error);
    }
  }

  async function addWorkRule(blockId: string) {
    if (!graph || graph.transaction.status !== "DRAFT") return;

    try {
      const res = await fetch("/api/engine/workrules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blockId,
          workType: "CUSTOM",
          quantity: 1,
          frequency: "ONCE",
          dueDates: [],
        }),
      });
      if (res.ok) {
        fetchData();
      }
    } catch (error) {
      console.error("Failed to add work rule:", error);
    }
  }

  async function updateWorkRule(ruleId: string, patch: Partial<WorkRule>) {
    if (!graph || graph.transaction.status !== "DRAFT") return;

    try {
      const res = await fetch(`/api/engine/workrules/${ruleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (res.ok) {
        fetchData();
      }
    } catch (error) {
      console.error("Failed to update work rule:", error);
    }
  }

  async function deleteWorkRule(ruleId: string) {
    if (!graph || graph.transaction.status !== "DRAFT") return;

    try {
      const res = await fetch(`/api/engine/workrules/${ruleId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchData();
      }
    } catch (error) {
      console.error("Failed to delete work rule:", error);
    }
  }

  async function activateTransaction() {
    if (!graph || graph.transaction.status !== "DRAFT") return;
    if (!confirm("Activate this transaction? Block structure will be locked.")) return;

    try {
      const res = await fetch(`/api/engine/transactions/${transactionId}/activate`, {
        method: "POST",
      });
      if (res.ok) {
        fetchData();
      }
    } catch (error) {
      console.error("Failed to activate transaction:", error);
    }
  }

  async function submitWorkItem(itemId: string) {
    try {
      const res = await fetch(`/api/engine/workitems/${itemId}/submit`, {
        method: "POST",
      });
      if (res.ok) {
        fetchData();
      }
    } catch (error) {
      console.error("Failed to submit work item:", error);
    }
  }

  async function approveWorkItem(itemId: string) {
    try {
      const res = await fetch(`/api/engine/workitems/${itemId}/approve`, {
        method: "POST",
      });
      if (res.ok) {
        fetchData();
      }
    } catch (error) {
      console.error("Failed to approve work item:", error);
    }
  }

  async function approveBlock(blockId: string) {
    try {
      const res = await fetch(`/api/engine/blocks/${blockId}/approve`, {
        method: "POST",
      });
      if (res.ok) {
        fetchData();
      }
    } catch (error) {
      console.error("Failed to approve block:", error);
    }
  }

  async function addApprover(blockId: string, role: "BUYER" | "SELLER" | "VERIFIER", displayName: string, required: boolean) {
    if (!graph || graph.transaction.status !== "DRAFT") return;

    try {
      const res = await fetch(`/api/engine/blocks/${blockId}/approvers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role,
          userId: displayName,
          displayName,
          required,
        }),
      });
      if (res.ok) {
        fetchData();
      }
    } catch (error) {
      console.error("Failed to add approver:", error);
    }
  }

  async function deleteApprover(approverId: string, blockId: string) {
    if (!graph || graph.transaction.status !== "DRAFT") return;

    try {
      const res = await fetch(`/api/engine/blocks/${blockId}/approvers/${approverId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchData();
      }
    } catch (error) {
      console.error("Failed to delete approver:", error);
    }
  }

  async function updateApprover(approverId: string, blockId: string, patch: { required?: boolean; role?: string; userId?: string }) {
    if (!graph || graph.transaction.status !== "DRAFT") return;

    try {
      const res = await fetch(`/api/engine/blocks/${blockId}/approvers/${approverId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...patch, blockId }),
      });
      if (res.ok) {
        fetchData();
      }
    } catch (error) {
      console.error("Failed to update approver:", error);
    }
  }

  if (loading) {
    return <div style={{ padding: 40 }}>Loading...</div>;
  }

  if (!graph) {
    return <div style={{ padding: 40 }}>Transaction not found</div>;
  }

  const isDraft = graph.transaction.status === "DRAFT";
  const overallDuration = graph.blocks.length > 0
    ? `Day 1 – Day ${Math.max(...graph.blocks.map((b) => b.endDay))}`
    : "Not set";

  const activeBlock = graph.blocks.find((b) => b.isActive);
  const activeBlockWorkItems = activeBlock
    ? graph.workItems.filter((wi) => {
        const rule = graph.workRules.find((r) => r.id === wi.workRuleId);
        return rule && rule.blockId === activeBlock.id;
      })
    : [];

  return (
    <main style={{ padding: "40px 20px", maxWidth: 1400, margin: "0 auto" }}>
      <h1 style={{ fontSize: "2.5rem", marginBottom: 10 }}>Design your transaction.</h1>

      {/* Transaction Header */}
      <div style={{ marginBottom: 30, padding: 20, border: "1px solid #e0e0e0", borderRadius: 8 }}>
        {isDraft ? (
          <>
            <input
              type="text"
              value={graph.transaction.title}
              onChange={(e) => updateTransaction({ title: e.target.value })}
              style={{ width: "100%", padding: 8, fontSize: "1.2rem", fontWeight: "600", border: "1px solid #e0e0e0", borderRadius: 4, marginBottom: 10 }}
            />
            <textarea
              value={graph.transaction.description || ""}
              onChange={(e) => updateTransaction({ description: e.target.value })}
              placeholder="Transaction description"
              rows={2}
              style={{ width: "100%", padding: 8, border: "1px solid #e0e0e0", borderRadius: 4, marginBottom: 10 }}
            />
          </>
        ) : (
          <>
            <h2 style={{ margin: 0, marginBottom: 5 }}>{graph.transaction.title}</h2>
            <p style={{ margin: 0, color: "#666" }}>{graph.transaction.description}</p>
          </>
        )}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 15 }}>
          <span style={{ color: "#666" }}>Overall Duration: {overallDuration}</span>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <span
              style={{
                padding: "4px 12px",
                borderRadius: 4,
                backgroundColor: graph.transaction.status === "DRAFT" ? "#f39c12" : graph.transaction.status === "ACTIVE" ? "#00b894" : "#666",
                color: "white",
                fontSize: "0.85rem",
                fontWeight: "600",
              }}
            >
              {graph.transaction.status}
            </span>
            {isDraft && (
              <button
                onClick={activateTransaction}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#00b894",
                  color: "white",
                  border: "none",
                  borderRadius: 4,
                  cursor: "pointer",
                  fontWeight: "600",
                }}
              >
                Activate Transaction
              </button>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 20 }}>
        {/* Main Content */}
        <div>
          {/* Blocks */}
          <div style={{ marginBottom: 40 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ fontSize: "1.8rem" }}>Blocks</h2>
              {isDraft && (
                <button
                  onClick={addBlock}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: "#0070f3",
                    color: "white",
                    border: "none",
                    borderRadius: 4,
                    cursor: "pointer",
                    fontWeight: "600",
                  }}
                >
                  + Add Block
                </button>
              )}
            </div>

            <div style={{ display: "grid", gap: 20 }}>
              {graph.blocks.map((block) => {
                const policy = graph.approvalPolicies.find((p) => p.id === block.approvalPolicyId);
                const approvers = graph.blockApprovers.filter((a) => a.blockId === block.id);
                const rules = graph.workRules.filter((r) => r.blockId === block.id);
                const blockItems = graph.workItems.filter((wi) => {
                  const rule = graph.workRules.find((r) => r.id === wi.workRuleId);
                  return rule && rule.blockId === block.id;
                });

                return (
                  <div
                    key={block.id}
                    style={{
                      padding: 20,
                      border: "1px solid #e0e0e0",
                      borderRadius: 8,
                      backgroundColor: block.isActive ? "#f0f9ff" : "white",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 15 }}>
                      <div style={{ flex: 1 }}>
                        {isDraft ? (
                          <input
                            type="text"
                            value={block.title}
                            onChange={(e) => updateBlock(block.id, { title: e.target.value })}
                            style={{ width: "100%", padding: 8, fontSize: "1.1rem", fontWeight: "600", border: "1px solid #e0e0e0", borderRadius: 4, marginBottom: 5 }}
                          />
                        ) : (
                          <h3 style={{ margin: 0, marginBottom: 5 }}>{block.title}</h3>
                        )}
                        <div style={{ display: "flex", gap: 15, alignItems: "center", marginBottom: 10 }}>
                          {isDraft ? (
                            <>
                              <span>Day</span>
                              <input
                                type="number"
                                value={block.startDay}
                                onChange={(e) => updateBlock(block.id, { startDay: parseInt(e.target.value) })}
                                style={{ width: 60, padding: 4, border: "1px solid #e0e0e0", borderRadius: 4 }}
                              />
                              <span>–</span>
                              <input
                                type="number"
                                value={block.endDay}
                                onChange={(e) => updateBlock(block.id, { endDay: parseInt(e.target.value) })}
                                style={{ width: 60, padding: 4, border: "1px solid #e0e0e0", borderRadius: 4 }}
                              />
                            </>
                          ) : (
                            <span style={{ fontSize: "0.9rem", color: "#666" }}>
                              Period: Day {block.startDay} – Day {block.endDay}
                            </span>
                          )}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        <span
                          style={{
                            padding: "4px 12px",
                            borderRadius: 4,
                            backgroundColor: block.isActive ? "#00b894" : "#f39c12",
                            color: "white",
                            fontSize: "0.85rem",
                            fontWeight: "600",
                          }}
                        >
                          {block.isActive ? "Active" : "Locked"}
                        </span>
                        {isDraft && graph.blocks.length > 1 && (
                          <button
                            onClick={() => deleteBlock(block.id)}
                            style={{
                              padding: "4px 8px",
                              backgroundColor: "#e74c3c",
                              color: "white",
                              border: "none",
                              borderRadius: 4,
                              cursor: "pointer",
                              fontSize: "0.85rem",
                            }}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Approval Policy */}
                    {isDraft && (
                      <div style={{ marginBottom: 15, padding: 10, backgroundColor: "#f8f9fa", borderRadius: 4 }}>
                        <label style={{ display: "block", marginBottom: 5, fontSize: "0.9rem", fontWeight: "600" }}>
                          Approval Policy:
                        </label>
                        <select
                          value={policy?.type || "SINGLE"}
                          onChange={(e) => {
                            // In real implementation, update policy
                          }}
                          style={{ padding: 4, border: "1px solid #e0e0e0", borderRadius: 4, fontSize: "0.9rem" }}
                        >
                          <option value="SINGLE">SINGLE</option>
                          <option value="ALL">ALL</option>
                          <option value="ANY">ANY</option>
                          <option value="THRESHOLD">THRESHOLD</option>
                        </select>
                      </div>
                    )}

                    {/* Work Rules */}
                    <div style={{ marginBottom: 15 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                        <h4 style={{ margin: 0, fontSize: "1rem" }}>Work Rules</h4>
                        {isDraft && (
                          <button
                            onClick={() => addWorkRule(block.id)}
                            style={{
                              padding: "4px 8px",
                              backgroundColor: "#6c5ce7",
                              color: "white",
                              border: "none",
                              borderRadius: 4,
                              cursor: "pointer",
                              fontSize: "0.85rem",
                            }}
                          >
                            + Add Rule
                          </button>
                        )}
                      </div>
                      {rules.map((rule) => (
                        <div
                          key={rule.id}
                          style={{
                            padding: 10,
                            marginBottom: 8,
                            border: "1px solid #e0e0e0",
                            borderRadius: 4,
                            backgroundColor: "#f8f9fa",
                          }}
                        >
                          {isDraft ? (
                            <>
                              <input
                                type="text"
                                value={rule.workType}
                                onChange={(e) => updateWorkRule(rule.id, { workType: e.target.value })}
                                placeholder="Work Type"
                                style={{ width: "100%", padding: 4, marginBottom: 5, border: "1px solid #e0e0e0", borderRadius: 4 }}
                              />
                              <div style={{ display: "flex", gap: 10, marginBottom: 5 }}>
                                <input
                                  type="number"
                                  value={rule.quantity}
                                  onChange={(e) => updateWorkRule(rule.id, { quantity: parseInt(e.target.value) })}
                                  placeholder="Quantity"
                                  style={{ width: 80, padding: 4, border: "1px solid #e0e0e0", borderRadius: 4 }}
                                />
                                <select
                                  value={rule.frequency}
                                  onChange={(e) => updateWorkRule(rule.id, { frequency: e.target.value as any })}
                                  style={{ padding: 4, border: "1px solid #e0e0e0", borderRadius: 4 }}
                                >
                                  <option value="ONCE">ONCE</option>
                                  <option value="DAILY">DAILY</option>
                                  <option value="WEEKLY">WEEKLY</option>
                                  <option value="CUSTOM">CUSTOM</option>
                                </select>
                              </div>
                              <input
                                type="text"
                                value={rule.dueDates.join(", ")}
                                onChange={(e) => {
                                  const dates = e.target.value.split(",").map((d) => parseInt(d.trim())).filter((n) => !isNaN(n));
                                  updateWorkRule(rule.id, { dueDates: dates });
                                }}
                                placeholder="Due Days (comma-separated)"
                                style={{ width: "100%", padding: 4, border: "1px solid #e0e0e0", borderRadius: 4 }}
                              />
                              <button
                                onClick={() => deleteWorkRule(rule.id)}
                                style={{
                                  marginTop: 5,
                                  padding: "2px 6px",
                                  backgroundColor: "#e74c3c",
                                  color: "white",
                                  border: "none",
                                  borderRadius: 4,
                                  cursor: "pointer",
                                  fontSize: "0.8rem",
                                }}
                              >
                                Delete
                              </button>
                            </>
                          ) : (
                            <div>
                              <div style={{ fontWeight: "600" }}>{rule.workType}</div>
                              <div style={{ fontSize: "0.85rem", color: "#666" }}>
                                Quantity: {rule.quantity} | Frequency: {rule.frequency}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Work Items (Active Block Only) */}
                    {block.isActive && blockItems.length > 0 && (
                      <div style={{ marginTop: 15, padding: 15, backgroundColor: "#fff5f5", borderRadius: 4 }}>
                        <h4 style={{ margin: 0, marginBottom: 10, fontSize: "1rem" }}>Work Items</h4>
                        {blockItems.map((item) => {
                          const rule = graph.workRules.find((r) => r.id === item.workRuleId);
                          return (
                            <div
                              key={item.id}
                              style={{
                                padding: 10,
                                marginBottom: 8,
                                border: "1px solid #e0e0e0",
                                borderRadius: 4,
                                backgroundColor: "white",
                              }}
                            >
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <div>
                                  <div style={{ fontWeight: "600" }}>{rule?.workType || "Work"}</div>
                                  <div style={{ fontSize: "0.85rem", color: "#666" }}>Due: Day {item.dueDay}</div>
                                </div>
                                <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                                  <span
                                    style={{
                                      padding: "2px 8px",
                                      borderRadius: 4,
                                      backgroundColor:
                                        item.status === "APPROVED" ? "#00b894" : item.status === "SUBMITTED" ? "#6c5ce7" : "#f39c12",
                                      color: "white",
                                      fontSize: "0.8rem",
                                    }}
                                  >
                                    {item.status}
                                  </span>
                                  {item.status === "PENDING" && (
                                    <button
                                      onClick={() => submitWorkItem(item.id)}
                                      style={{
                                        padding: "4px 8px",
                                        backgroundColor: "#6c5ce7",
                                        color: "white",
                                        border: "none",
                                        borderRadius: 4,
                                        cursor: "pointer",
                                        fontSize: "0.8rem",
                                      }}
                                    >
                                      Submit
                                    </button>
                                  )}
                                  {item.status === "SUBMITTED" && (
                                    <button
                                      onClick={() => approveWorkItem(item.id)}
                                      style={{
                                        padding: "4px 8px",
                                        backgroundColor: "#00b894",
                                        color: "white",
                                        border: "none",
                                        borderRadius: 4,
                                        cursor: "pointer",
                                        fontSize: "0.8rem",
                                      }}
                                    >
                                      Approve
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        {blockItems.every((i) => i.status === "APPROVED") && (
                          <button
                            onClick={() => approveBlock(block.id)}
                            style={{
                              marginTop: 10,
                              width: "100%",
                              padding: "8px 16px",
                              backgroundColor: "#00b894",
                              color: "white",
                              border: "none",
                              borderRadius: 4,
                              cursor: "pointer",
                              fontWeight: "600",
                            }}
                          >
                            Approve Block
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Timeline Preview */}
          <div style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: "1.8rem", marginBottom: 20 }}>Timeline Preview</h2>
            <div style={{ border: "1px solid #e0e0e0", borderRadius: 8, padding: 20 }}>
              {graph.blocks.length === 0 ? (
                <p style={{ color: "#666", textAlign: "center" }}>No blocks yet</p>
              ) : (
                <div style={{ display: "grid", gap: 10 }}>
                  {graph.blocks.map((block) => (
                    <div
                      key={block.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: 12,
                        backgroundColor: block.isActive ? "#f0f9ff" : "#f8f9fa",
                        borderRadius: 4,
                      }}
                    >
                      <span>Day {block.startDay}–{block.endDay}</span>
                      <span style={{ fontWeight: "600" }}>{block.title}</span>
                      <span
                        style={{
                          padding: "2px 8px",
                          borderRadius: 4,
                          backgroundColor: block.isActive ? "#00b894" : "#e0e0e0",
                          color: block.isActive ? "white" : "#666",
                          fontSize: "0.85rem",
                        }}
                      >
                        {block.isActive ? "Active" : "Locked"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Activity Log */}
        <div>
          <h3 style={{ fontSize: "1.2rem", marginBottom: 15 }}>Activity Log</h3>
          <div style={{ border: "1px solid #e0e0e0", borderRadius: 8, padding: 15, maxHeight: "600px", overflowY: "auto" }}>
            {logs.length === 0 ? (
              <p style={{ color: "#666", fontSize: "0.9rem" }}>No activity yet</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {logs.map((log) => (
                  <div
                    key={log.id}
                    style={{
                      padding: 10,
                      borderLeft: "3px solid #0070f3",
                      backgroundColor: "#f8f9fa",
                      borderRadius: 4,
                    }}
                  >
                    <div style={{ fontWeight: "600", fontSize: "0.9rem", marginBottom: 4 }}>
                      {log.action.replace(/_/g, " ")}
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "#666" }}>
                      {log.actorRole} • {new Date(log.timestamp).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
