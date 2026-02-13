"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/provider";
import type {
  TransactionGraph,
  Transaction,
  Block,
  ApprovalPolicy,
  BlockApprover,
  WorkRule,
  WorkItem,
  ActivityLog,
  ApproverRole,
  WorkRuleType,
  ApprovalPolicyType,
} from "@/lib/transaction-engine/types";
import { daysBetween } from "@/lib/transaction-engine/dateUtils";
import { TransactionCalendar, BLOCK_COLORS } from "@/components/TransactionCalendar";
import { useAutoSave, useAutoSaveByKey, SaveStatusIndicator } from "@/lib/hooks/useAutoSave";

export default function TransactionBuilderPage() {
  const params = useParams();
  const transactionId = params.id as string;
  const { t, tKey, lang, setLang } = useI18n();
  const [graph, setGraph] = useState<TransactionGraph | null>(null);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingBlock, setEditingBlock] = useState<string | null>(null);
  const [editingWorkRule, setEditingWorkRule] = useState<string | null>(null);
  const [localBlockTitles, setLocalBlockTitles] = useState<Record<string, string>>({});
  const [localWorkRuleTitles, setLocalWorkRuleTitles] = useState<Record<string, string>>({});
  const [localTxTitle, setLocalTxTitle] = useState<string | undefined>(undefined);
  const [localTxDesc, setLocalTxDesc] = useState<string | undefined>(undefined);
  const { status: saveStatusTxTitle, triggerSave: triggerSaveTxTitle } = useAutoSave();
  const { status: saveStatusTxDesc, triggerSave: triggerSaveTxDesc } = useAutoSave();
  const { getStatus: getBlockSaveStatus, triggerSave: triggerSaveBlock } = useAutoSaveByKey();
  const { getStatus: getWorkRuleSaveStatus, triggerSave: triggerSaveWorkRule } = useAutoSaveByKey();
  const [addApproverBlockId, setAddApproverBlockId] = useState<string | null>(null);
  const [addApproverRole, setAddApproverRole] = useState<ApproverRole>("VERIFIER");
  const [addApproverDisplayName, setAddApproverDisplayName] = useState("");

  const APPROVER_ROLES: ApproverRole[] = ["BUYER", "SELLER", "VERIFIER", "ADMIN"];
  const WORK_RULE_TYPES: WorkRuleType[] = ["BLOG", "CUSTOM", "REVIEW", "SIGN_OFF", "DELIVERY", "DOCUMENT", "INSPECTION"];

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

  async function updateTransaction(patch: Partial<Transaction>): Promise<void> {
    if (!graph || graph.transaction.status !== "DRAFT") return;

    const res = await fetch(`/api/engine/transactions/${transactionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Failed to update transaction");
    }
    await fetchData();
  }

  async function addBlock() {
    if (!graph || graph.transaction.status !== "DRAFT") return;
    if (!graph.transaction.startDate || !graph.transaction.endDate) {
      console.error("Transaction must have startDate and endDate");
      return;
    }

    const orderIndex = graph.blocks.length + 1;
    try {
      const res = await fetch("/api/engine/blocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactionId,
          title: `Block ${orderIndex}`,
          orderIndex,
          approvalType: "SINGLE",
        }),
      });
      if (res.ok) {
        fetchData();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to add block");
      }
    } catch (error) {
      console.error("Failed to add block:", error);
    }
  }

  async function updateBlock(blockId: string, patch: Partial<Block>): Promise<void> {
    if (!graph || graph.transaction.status !== "DRAFT") return;
    if (blockId == null || blockId === "") {
      console.warn("[Builder] updateBlock: blockId is undefined or empty");
      return;
    }

    const res = await fetch("/api/engine/blocks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: blockId, patch }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Failed to update block");
    }
    await fetchData();
  }

  async function updateApprovalPolicyType(policyId: string, type: ApprovalPolicyType) {
    if (!graph || graph.transaction.status !== "DRAFT") return;
    if (policyId == null || policyId === "") {
      console.warn("[Builder] updateApprovalPolicyType: policyId is undefined or empty");
      return;
    }

    try {
      const res = await fetch(`/api/engine/approval-policies/${policyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      if (res.ok) await fetchData();
    } catch (error) {
      console.error("Failed to update approval policy:", error);
    }
  }

  async function deleteBlock(blockId: string) {
    if (!graph || graph.transaction.status !== "DRAFT") return;
    if (blockId == null || blockId === "") {
      console.warn("[Builder] deleteBlock: blockId is undefined or empty");
      return;
    }

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

  async function addWorkRule(blockId: string, workType: WorkRuleType = "CUSTOM") {
    if (!graph || graph.transaction.status !== "DRAFT") return;

    try {
      const res = await fetch("/api/engine/workrules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blockId,
          workType,
          title: "",
          quantity: 1,
          frequency: "ONCE",
          dueDates: [],
        }),
      });
      if (res.ok) await fetchData();
    } catch (error) {
      console.error("Failed to add work rule:", error);
    }
  }

  async function updateWorkRule(ruleId: string, patch: Partial<WorkRule>): Promise<void> {
    if (!graph || graph.transaction.status !== "DRAFT") return;
    if (ruleId == null || ruleId === "") {
      console.warn("[Builder] updateWorkRule: ruleId is undefined or empty");
      return;
    }

    const res = await fetch(`/api/engine/workrules/${ruleId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Failed to update work rule");
    }
    await fetchData();
  }

  async function deleteWorkRule(workRuleId: string) {
    if (!graph || graph.transaction.status !== "DRAFT") return;
    if (workRuleId == null || workRuleId === "") {
      console.warn("[Builder] deleteWorkRule: workRuleId is undefined or empty");
      return;
    }

    try {
      const res = await fetch(`/api/engine/workrules/${workRuleId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await fetchData();
      } else {
        const err = await res.json();
        console.error("WorkRule delete failed:", err);
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

  async function addApprover(blockId: string, role: ApproverRole, displayName: string, required: boolean) {
    if (!graph || graph.transaction.status !== "DRAFT") return;

    try {
      const res = await fetch(`/api/engine/blocks/${blockId}/approvers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role,
          userId: displayName.trim() || displayName,
          displayName: displayName.trim() || displayName,
          required,
        }),
      });
      if (res.ok) {
        setAddApproverBlockId(null);
        setAddApproverDisplayName("");
        await fetchData();
      } else {
        const err = await res.json();
        console.error("Add approver failed:", err);
      }
    } catch (error) {
      console.error("Failed to add approver:", error);
    }
  }

  async function deleteApprover(approverId: string, blockId: string) {
    if (!graph || graph.transaction.status !== "DRAFT") return;
    if (approverId == null || approverId === "") {
      console.warn("[Builder] deleteApprover: approverId is undefined or empty");
      return;
    }
    if (blockId == null || blockId === "") {
      console.warn("[Builder] deleteApprover: blockId is undefined or empty");
      return;
    }

    try {
      const res = await fetch(`/api/engine/blocks/${blockId}/approvers/${approverId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setGraph((prev) =>
          prev
            ? { ...prev, blockApprovers: prev.blockApprovers.filter((a) => a.id !== approverId) }
            : null
        );
        await fetchData();
      } else {
        const err = await res.json();
        console.error("Approver delete failed:", err);
      }
    } catch (error) {
      console.error("Failed to delete approver:", error);
    }
  }

  async function updateApprover(approverId: string, blockId: string, patch: { required?: boolean; role?: string; userId?: string }) {
    if (!graph || graph.transaction.status !== "DRAFT") return;
    if (approverId == null || approverId === "") {
      console.warn("[Builder] updateApprover: approverId is undefined or empty");
      return;
    }
    if (blockId == null || blockId === "") {
      console.warn("[Builder] updateApprover: blockId is undefined or empty");
      return;
    }

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
    return <div style={{ padding: 40 }}>{t.loading}</div>;
  }

  if (!graph) {
    return <div style={{ padding: 40 }}>{t.transactionNotFound}</div>;
  }

  const isDraft = graph.transaction.status === "DRAFT";
  const txStart = graph.transaction.startDate;
  const txEnd = graph.transaction.endDate;
  const totalDays = txStart && txEnd ? daysBetween(txStart, txEnd) : 0;
  const overallDuration = txStart && txEnd
    ? `${txStart} → ${txEnd} (${totalDays} days)`
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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1 style={{ fontSize: "2.5rem", marginBottom: 0 }}>{t.slogan}</h1>
        <div style={{ display: "flex", gap: 12, alignItems: "center", fontSize: "0.9rem" }}>
          <span
            onClick={() => setLang("en")}
            style={{
              cursor: "pointer",
              color: lang === "en" ? "#0070f3" : "#666",
              fontWeight: lang === "en" ? "600" : "400",
              textDecoration: lang === "en" ? "underline" : "none",
            }}
          >
            EN
          </span>
          <span style={{ color: "#ccc" }}>|</span>
          <span
            onClick={() => setLang("ko")}
            style={{
              cursor: "pointer",
              color: lang === "ko" ? "#0070f3" : "#666",
              fontWeight: lang === "ko" ? "600" : "400",
              textDecoration: lang === "ko" ? "underline" : "none",
            }}
          >
            KO
          </span>
        </div>
      </div>

      {/* Transaction Header */}
      <div style={{ marginBottom: 30, padding: 20, border: "1px solid #e0e0e0", borderRadius: 8, position: "relative" }}>
        {isDraft ? (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <input
                type="text"
                value={localTxTitle ?? graph.transaction.title ?? ""}
                onChange={(e) => setLocalTxTitle(e.target.value)}
                onBlur={() => {
                  const title = (localTxTitle ?? graph.transaction.title ?? "").trim();
                  const serverTitle = (graph.transaction.title ?? "").trim();
                  setLocalTxTitle(undefined);
                  if (title === serverTitle) return;
                  triggerSaveTxTitle(async () => {
                    await updateTransaction({ title: title || undefined });
                  });
                }}
                style={{ flex: 1, padding: 8, fontSize: "1.2rem", fontWeight: "600", border: "1px solid #e0e0e0", borderRadius: 4 }}
              />
              <SaveStatusIndicator status={saveStatusTxTitle} />
            </div>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 10 }}>
              <textarea
                value={localTxDesc ?? graph.transaction.description ?? ""}
                onChange={(e) => setLocalTxDesc(e.target.value)}
                onBlur={() => {
                  const description = (localTxDesc ?? graph.transaction.description ?? "").trim();
                  const serverDesc = (graph.transaction.description ?? "").trim();
                  setLocalTxDesc(undefined);
                  if (description === serverDesc) return;
                  triggerSaveTxDesc(async () => {
                    await updateTransaction({ description: description || undefined });
                  });
                }}
                placeholder={t.transactionDescription}
                rows={2}
                style={{ flex: 1, padding: 8, border: "1px solid #e0e0e0", borderRadius: 4 }}
              />
              <SaveStatusIndicator status={saveStatusTxDesc} />
            </div>
          </>
        ) : (
          <>
            <h2 style={{ margin: 0, marginBottom: 5 }}>{graph.transaction.title}</h2>
            <p style={{ margin: 0, color: "#666" }}>{graph.transaction.description}</p>
          </>
        )}
        {isDraft && (
          <div style={{ display: "flex", gap: 16, alignItems: "center", marginTop: 10, flexWrap: "wrap" }}>
            <label style={{ fontSize: "0.9rem", color: "#666" }}>
              {t.startDate}: <input type="date" value={txStart || ""} onChange={(e) => updateTransaction({ startDate: e.target.value })} style={{ padding: 4, border: "1px solid #e0e0e0", borderRadius: 4 }} />
            </label>
            <label style={{ fontSize: "0.9rem", color: "#666" }}>
              {t.endDate}: <input type="date" value={txEnd || ""} onChange={(e) => updateTransaction({ endDate: e.target.value })} style={{ padding: 4, border: "1px solid #e0e0e0", borderRadius: 4 }} />
            </label>
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 15 }}>
          <span style={{ color: "#666" }}>{t.overallDuration}: {overallDuration}</span>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <Link
              href={`/transaction/preview/${transactionId}`}
              style={{
                padding: "8px 16px",
                backgroundColor: "#6366f1",
                color: "white",
                border: "none",
                borderRadius: 4,
                cursor: "pointer",
                fontWeight: "600",
                textDecoration: "none",
              }}
            >
              {t.executionPlan?.preview ?? "Preview"}
            </Link>
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
                {t.activateTransaction}
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
              <h2 style={{ fontSize: "1.8rem" }}>{t.blocks}</h2>
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
                  {t.addBlock}
                </button>
              )}
            </div>

            <div style={{ display: "grid", gap: 20 }}>
              {graph.blocks.map((block, blockIndex) => {
                const policy = graph.approvalPolicies.find((p) => p.id === block.approvalPolicyId);
                const approvers = graph.blockApprovers.filter((a) => a.blockId === block.id);
                const rules = graph.workRules.filter((r) => r.blockId === block.id);
                const blockItems = graph.workItems.filter((wi) => {
                  const rule = graph.workRules.find((r) => r.id === wi.workRuleId);
                  return rule && rule.blockId === block.id;
                });
                const blockColor = BLOCK_COLORS[blockIndex % BLOCK_COLORS.length];

                return (
                  <div
                    key={block.id}
                    style={{
                      padding: 20,
                      border: "1px solid #e0e0e0",
                      borderLeft: `4px solid ${blockColor}`,
                      borderRadius: 8,
                      backgroundColor: block.isActive ? "#f0f9ff" : "white",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 15 }}>
                      <div style={{ flex: 1 }}>
                        {isDraft ? (
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                            <span
                              style={{
                                width: 12,
                                height: 12,
                                borderRadius: 2,
                                backgroundColor: blockColor,
                                flexShrink: 0,
                              }}
                              title={t.blockTitle}
                            />
                            <input
                              type="text"
                              value={localBlockTitles[block.id] ?? tKey(block.title)}
                              onChange={(e) => setLocalBlockTitles((prev) => ({ ...prev, [block.id]: e.target.value }))}
                              onBlur={() => {
                                const title = (localBlockTitles[block.id] ?? tKey(block.title)).trim();
                                setLocalBlockTitles((prev) => {
                                  const next = { ...prev };
                                  delete next[block.id];
                                  return next;
                                });
                                if (title === tKey(block.title).trim()) return;
                                triggerSaveBlock(block.id, async () => {
                                  await updateBlock(block.id, { title });
                                });
                              }}
                              placeholder={t.blockTitle}
                              style={{ flex: 1, padding: 8, fontSize: "1.1rem", fontWeight: "600", border: "1px solid #e0e0e0", borderRadius: 4 }}
                            />
                            <SaveStatusIndicator status={getBlockSaveStatus(block.id)} />
                          </div>
                        ) : (
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                            <span
                              style={{
                                width: 12,
                                height: 12,
                                borderRadius: 2,
                                backgroundColor: blockColor,
                                flexShrink: 0,
                              }}
                            />
                            <span style={{ fontSize: "1rem", color: "#666" }}>🔒</span>
                            <h3 style={{ margin: 0 }}>{tKey(block.title)}</h3>
                          </div>
                        )}
                        <div style={{ display: "flex", gap: 15, alignItems: "center", marginBottom: 10, flexWrap: "wrap" }}>
                          {isDraft ? (
                            <>
                              <input
                                type="date"
                                value={block.startDate}
                                onChange={(e) => updateBlock(block.id, { startDate: e.target.value })}
                                style={{ padding: 4, border: "1px solid #e0e0e0", borderRadius: 4 }}
                              />
                              <span>→</span>
                              <input
                                type="date"
                                value={block.endDate}
                                onChange={(e) => updateBlock(block.id, { endDate: e.target.value })}
                                style={{ padding: 4, border: "1px solid #e0e0e0", borderRadius: 4 }}
                              />
                              <span style={{ fontSize: "0.85rem", color: "#666" }}>
                                ({daysBetween(block.startDate, block.endDate)} days)
                              </span>
                            </>
                          ) : (
                            <span style={{ fontSize: "0.9rem", color: "#666" }}>
                              {block.startDate} → {block.endDate} ({daysBetween(block.startDate, block.endDate)} days)
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
                          {block.isActive ? t.active : t.locked}
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
                            {t.delete}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Approval Policy — editable only when transaction.status === "DRAFT" */}
                    <div style={{ marginBottom: 15, padding: 10, backgroundColor: "#f8f9fa", borderRadius: 4 }}>
                      <label style={{ display: "block", marginBottom: 5, fontSize: "0.9rem", fontWeight: "600" }}>
                        {t.approvalPolicy}:
                      </label>
                      <select
                        value={policy?.type || "SINGLE"}
                        onChange={(e) => {
                          const type = e.target.value as ApprovalPolicyType;
                          if (policy?.id && isDraft) updateApprovalPolicyType(policy.id, type);
                        }}
                        disabled={!isDraft}
                        style={{
                          padding: 4,
                          border: "1px solid #e0e0e0",
                          borderRadius: 4,
                          fontSize: "0.9rem",
                          backgroundColor: isDraft ? "white" : "#f0f0f0",
                          cursor: isDraft ? "pointer" : "not-allowed",
                        }}
                      >
                        <option value="SINGLE">SINGLE</option>
                        <option value="ALL">ALL</option>
                        <option value="ANY">ANY</option>
                        <option value="THRESHOLD">THRESHOLD</option>
                      </select>
                      {!isDraft && (
                        <p style={{ margin: "5px 0 0 0", fontSize: "0.8rem", color: "#666" }}>
                          {t.lockedAfterActivation}
                        </p>
                      )}
                    </div>

                    {/* Approvers — role = SELECT (enum), display name = text input */}
                    <div style={{ marginBottom: 15, padding: 10, backgroundColor: "#f8f9fa", borderRadius: 4 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                        <label style={{ fontSize: "0.9rem", fontWeight: "600" }}>{t.approvers}:</label>
                        {isDraft && addApproverBlockId !== block.id && (
                          <button
                            type="button"
                            onClick={() => setAddApproverBlockId(block.id)}
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
                            {t.addApprover}
                          </button>
                        )}
                      </div>
                      {isDraft && addApproverBlockId === block.id && (
                        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10, flexWrap: "wrap" }}>
                          <select
                            value={addApproverRole}
                            onChange={(e) => setAddApproverRole(e.target.value as ApproverRole)}
                            style={{ padding: 6, border: "1px solid #e0e0e0", borderRadius: 4, fontSize: "0.9rem" }}
                          >
                            {APPROVER_ROLES.map((r) => (
                              <option key={r} value={r}>{r}</option>
                            ))}
                          </select>
                          <input
                            type="text"
                            value={addApproverDisplayName}
                            onChange={(e) => setAddApproverDisplayName(e.target.value)}
                            placeholder={t.enterDisplayName}
                            style={{ padding: 6, border: "1px solid #e0e0e0", borderRadius: 4, fontSize: "0.9rem", minWidth: 140 }}
                          />
                          <button
                            type="button"
                            onClick={() => addApprover(block.id, addApproverRole, addApproverDisplayName, true)}
                            style={{
                              padding: "6px 12px",
                              backgroundColor: "#00b894",
                              color: "white",
                              border: "none",
                              borderRadius: 4,
                              cursor: "pointer",
                              fontSize: "0.85rem",
                            }}
                          >
                            Add
                          </button>
                          <button
                            type="button"
                            onClick={() => { setAddApproverBlockId(null); setAddApproverDisplayName(""); }}
                            style={{
                              padding: "6px 12px",
                              backgroundColor: "#95a5a6",
                              color: "white",
                              border: "none",
                              borderRadius: 4,
                              cursor: "pointer",
                              fontSize: "0.85rem",
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                      {approvers.length === 0 ? (
                        <p style={{ fontSize: "0.85rem", color: "#666", fontStyle: "italic" }}>{t.noApproversYet}</p>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          {approvers.map((approver) => (
                            <div
                              key={approver.id}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                                padding: 8,
                                backgroundColor: "white",
                                borderRadius: 4,
                                border: "1px solid #e0e0e0",
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={approver.required}
                                onChange={(e) => {
                                  if (isDraft) updateApprover(approver.id, block.id, { required: e.target.checked });
                                }}
                                disabled={!isDraft}
                                style={{ cursor: isDraft ? "pointer" : "not-allowed" }}
                              />
                              <span style={{ fontSize: "0.9rem", fontWeight: "600", minWidth: 100 }}>
                                {approver.role}
                              </span>
                              <span style={{ fontSize: "0.85rem", color: "#666", flex: 1 }}>
                                {approver.userId || "Unnamed"}
                              </span>
                              {approver.required && (
                                <span style={{ fontSize: "0.75rem", color: "#e74c3c", fontWeight: "600" }}>
                                  {t.required}
                                </span>
                              )}
                              {!approver.required && (
                                <span style={{ fontSize: "0.75rem", color: "#666" }}>{t.optional}</span>
                              )}
                              {isDraft && (
                                <button
                                  onClick={() => deleteApprover(approver.id, block.id)}
                                  style={{
                                    padding: "2px 6px",
                                    backgroundColor: "#e74c3c",
                                    color: "white",
                                    border: "none",
                                    borderRadius: 4,
                                    cursor: "pointer",
                                    fontSize: "0.75rem",
                                  }}
                                >
                                  {t.remove}
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      {!isDraft && approvers.length > 0 && (
                        <p style={{ margin: "10px 0 0 0", fontSize: "0.8rem", color: "#666" }}>
                          {t.lockedAfterActivation}
                        </p>
                      )}
                    </div>

                    {/* Work Rules */}
                    <div style={{ marginBottom: 15 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                        <h4 style={{ margin: 0, fontSize: "1rem" }}>{t.workRules}</h4>
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
                            {t.addRule}
                          </button>
                        )}
                      </div>
                      {rules.map((rule) => {
                        const ruleWorkType = WORK_RULE_TYPES.includes(rule.workType as WorkRuleType) ? (rule.workType as WorkRuleType) : "CUSTOM";
                        return (
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
                              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 5, flexWrap: "wrap" }}>
                                <label style={{ fontSize: "0.85rem", color: "#666", minWidth: 50 }}>{t.workType}:</label>
                                <select
                                  value={ruleWorkType}
                                  onChange={(e) => updateWorkRule(rule.id, { workType: e.target.value as WorkRuleType })}
                                  style={{ padding: 4, border: "1px solid #e0e0e0", borderRadius: 4, fontSize: "0.9rem" }}
                                >
                                  {WORK_RULE_TYPES.map((wt) => (
                                    <option key={wt} value={wt}>{wt}</option>
                                  ))}
                                </select>
                                <span style={{ fontSize: "0.85rem", color: "#666" }}>{t.workRuleTitle}:</span>
                                <input
                                  type="text"
                                  value={localWorkRuleTitles[rule.id] ?? rule.title ?? ""}
                                  onChange={(e) => setLocalWorkRuleTitles((prev) => ({ ...prev, [rule.id]: e.target.value }))}
                                  onBlur={() => {
                                    if (rule.id == null || rule.id === "") {
                                      console.warn("[Builder] WorkRule title onBlur: rule.id is undefined or empty");
                                      return;
                                    }
                                    const title = (localWorkRuleTitles[rule.id] ?? rule.title ?? "").trim();
                                    setLocalWorkRuleTitles((prev) => {
                                      const next = { ...prev };
                                      delete next[rule.id];
                                      return next;
                                    });
                                    if (title === (rule.title ?? "").trim()) return;
                                    triggerSaveWorkRule(rule.id, async () => {
                                      await updateWorkRule(rule.id, { title: title || undefined });
                                    });
                                  }}
                                  placeholder={t.workRuleTitle}
                                  style={{ flex: 1, minWidth: 120, padding: 4, border: "1px solid #e0e0e0", borderRadius: 4 }}
                                />
                                <SaveStatusIndicator status={getWorkRuleSaveStatus(rule.id)} />
                              </div>
                              <div style={{ display: "flex", gap: 10, marginBottom: 5 }}>
                                <input
                                  type="number"
                                  value={rule.quantity}
                                  onChange={(e) => updateWorkRule(rule.id, { quantity: parseInt(e.target.value) || 0 })}
                                  onBlur={() => fetchData()}
                                  placeholder={t.quantity}
                                  style={{ width: 80, padding: 4, border: "1px solid #e0e0e0", borderRadius: 4 }}
                                />
                                <select
                                  value={rule.frequency}
                                  onChange={(e) => updateWorkRule(rule.id, { frequency: e.target.value as any })}
                                  style={{ padding: 4, border: "1px solid #e0e0e0", borderRadius: 4 }}
                                >
                                  <option value="ONCE">{t.once}</option>
                                  <option value="DAILY">{t.daily}</option>
                                  <option value="WEEKLY">{t.weekly}</option>
                                  <option value="CUSTOM">{t.custom}</option>
                                </select>
                              </div>
                              <input
                                type="text"
                                value={rule.dueDates.join(", ")}
                                onChange={(e) => {
                                  const dates = e.target.value.split(",").map((d) => parseInt(d.trim())).filter((n) => !isNaN(n));
                                  updateWorkRule(rule.id, { dueDates: dates });
                                }}
                                onBlur={() => fetchData()}
                                placeholder={t.dueDates}
                                style={{ width: "100%", padding: 4, border: "1px solid #e0e0e0", borderRadius: 4 }}
                              />
                              <button
                                onClick={() => deleteWorkRule(rule.id)}
                                type="button"
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
                                {t.delete}
                              </button>
                            </>
                          ) : (
                            <div>
                              <div style={{ fontWeight: "600" }}>{rule.title || rule.workType}</div>
                              <div style={{ fontSize: "0.85rem", color: "#666" }}>
                                {rule.workType} · {t.quantity}: {rule.quantity} | {t.frequency}: {rule.frequency}
                              </div>
                            </div>
                          )}
                        </div>
                      ); })}
                    </div>

                    {/* Work Items (Active Block Only) */}
                    {block.isActive && blockItems.length > 0 && (
                      <div style={{ marginTop: 15, padding: 15, backgroundColor: "#fff5f5", borderRadius: 4 }}>
                        <h4 style={{ margin: 0, marginBottom: 10, fontSize: "1rem" }}>{t.workItems}</h4>
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
                                      {t.submit}
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
                                      {t.approve}
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
                            {t.approveBlock}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Timeline: 설계 결과를 “실제 날짜 기준으로 어떻게 흘러가는지” 한눈에 보는 시각화. 읽기 전용. */}
          <div style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: "1.8rem", marginBottom: 20 }}>{t.timeline}</h2>
            {!txStart || !txEnd ? (
              <p style={{ color: "#666", textAlign: "center", padding: 20, border: "1px solid #e0e0e0", borderRadius: 8 }}>
                Set transaction start/end date to see the calendar.
              </p>
            ) : (
              <TransactionCalendar
                txStartDate={txStart}
                txEndDate={txEnd}
                blocks={graph.blocks}
                approvalPolicies={graph.approvalPolicies}
                blockApprovers={graph.blockApprovers}
                title={t.calendar ?? "Calendar"}
              />
            )}
          </div>
        </div>

        {/* Activity Log */}
        <div>
          <h3 style={{ fontSize: "1.2rem", marginBottom: 15 }}>{t.activityLog}</h3>
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
