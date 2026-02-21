"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/provider";
import { BlockQuestionBuilder, type BlockQuestion } from "@/components/question-builder/BlockQuestionBuilder";
import type {
  TransactionGraph,
  Transaction,
  Block,
  ActivityLog,
  ApproverRole,
  ApprovalPolicyType,
  ApprovalMode,
  BlockStatus,
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
  const [localBlockTitles, setLocalBlockTitles] = useState<Record<string, string>>({});
  const [localTxTitle, setLocalTxTitle] = useState<string | undefined>(undefined);
  const [localTxDesc, setLocalTxDesc] = useState<string | undefined>(undefined);
  const [blockQuestionsByBlockId, setBlockQuestionsByBlockId] = useState<Record<string, BlockQuestion[]>>({});
  const [blockReadinessByBlockId, setBlockReadinessByBlockId] = useState<
    Record<
      string,
      {
        ready: boolean;
        missingRequired: Array<{ questionId: string; reason: string }>;
        status?: BlockStatus;
        approvalMode?: ApprovalMode;
        dueDate?: string;
      }
    >
  >({});
  const { status: saveStatusTxTitle, triggerSave: triggerSaveTxTitle } = useAutoSave();
  const { status: saveStatusTxDesc, triggerSave: triggerSaveTxDesc } = useAutoSave();
  const { getStatus: getBlockSaveStatus, triggerSave: triggerSaveBlock } = useAutoSaveByKey();
  const [addApproverBlockId, setAddApproverBlockId] = useState<string | null>(null);
  const [addApproverRole, setAddApproverRole] = useState<ApproverRole>("VERIFIER");
  const [addApproverDisplayName, setAddApproverDisplayName] = useState("");
  const [draggingBlockId, setDraggingBlockId] = useState<string | null>(null);
  const [dropTargetBlockId, setDropTargetBlockId] = useState<string | null>(null);

  const APPROVER_ROLES: ApproverRole[] = ["BUYER", "SELLER", "VERIFIER", "ADMIN"];
  const APPROVAL_MODES: ApprovalMode[] = [
    "MANUAL_REVIEW_REQUIRED",
    "AUTO_APPROVE_THEN_RELEASE",
    "AUTO_DISPUTE_IF_NO_RESPONSE",
    "AUTO_RELEASE",
  ];

  useEffect(() => {
    if (transactionId) {
      fetchData();
    }
  }, [transactionId]);

  async function fetchBlockQuestions(blockId: string) {
    const res = await fetch(`/api/engine/blocks/${blockId}/questions`, { cache: "no-store" });
    if (!res.ok) return;
    const json = await res.json();
    if (json.ok && Array.isArray(json.data)) {
      setBlockQuestionsByBlockId((prev) => ({ ...prev, [blockId]: json.data }));
    }
  }

  async function fetchBlockReadiness(blockId: string) {
    const res = await fetch(`/api/engine/trades/${transactionId}/blocks/${blockId}/readiness`, { cache: "no-store" });
    if (!res.ok) return;
    const json = await res.json();
    if (json.ok && json.data) {
      setBlockReadinessByBlockId((prev) => ({ ...prev, [blockId]: json.data }));
    }
  }

  useEffect(() => {
    if (!graph?.blocks?.length) return;
    graph.blocks.forEach((b) => fetchBlockQuestions(b.id));
  }, [graph?.blocks?.map((b) => b.id).join(",")]);

  useEffect(() => {
    if (!graph?.blocks?.length) return;
    graph.blocks.forEach((b) => fetchBlockReadiness(b.id));
  }, [graph?.blocks?.map((b) => b.id).join(","), transactionId]);

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

  async function addQuestion(blockId: string) {
    if (!graph || graph.transaction.status !== "DRAFT") return;
    try {
      const res = await fetch(`/api/engine/blocks/${blockId}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "SHORT_TEXT", label: "Untitled question", required: false, allowAttachment: false }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.ok) {
          await fetchBlockQuestions(blockId);
          await fetchBlockReadiness(blockId);
        }
      } else {
        const err = await res.json().catch(() => ({}));
        console.error("Failed to add question:", err);
        alert(err.error || "Failed to add question");
      }
    } catch (e) {
      console.error("Failed to add question:", e);
    }
  }

  async function updateQuestion(questionId: string, patch: Partial<BlockQuestion>) {
    try {
      const res = await fetch(`/api/engine/questions/${questionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.ok && json.data?.block_id) {
          await fetchBlockQuestions(json.data.block_id);
          await fetchBlockReadiness(json.data.block_id);
        }
      }
    } catch (e) {
      console.error("Failed to update question:", e);
    }
  }

  async function deleteQuestion(questionId: string, blockId: string) {
    try {
      const res = await fetch(`/api/engine/questions/${questionId}`, { method: "DELETE" });
      if (res.ok) {
        await fetchBlockQuestions(blockId);
        await fetchBlockReadiness(blockId);
      }
    } catch (e) {
      console.error("Failed to delete question:", e);
    }
  }

  async function reorderQuestions(blockId: string, orderedQuestionIds: string[]) {
    try {
      const res = await fetch("/api/engine/questions/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blockId, orderedQuestionIds }),
      });
      if (res.ok) {
        await fetchBlockQuestions(blockId);
        await fetchBlockReadiness(blockId);
      }
    } catch (e) {
      console.error("Failed to reorder questions:", e);
    }
  }

  async function duplicateQuestion(blockId: string, source: BlockQuestion) {
    try {
      const created = await fetch(`/api/engine/blocks/${blockId}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: source.type,
          label: source.label || "Untitled question",
          description: source.description,
          required: source.required,
          allowAttachment: Boolean(source.allow_attachment),
          options: source.options ?? {},
        }),
      });
      if (created.ok) {
        await fetchBlockQuestions(blockId);
        await fetchBlockReadiness(blockId);
      }
    } catch (e) {
      console.error("Failed to duplicate question:", e);
    }
  }

  async function reorderBlocks(orderedBlockIds: string[]) {
    try {
      const res = await fetch("/api/engine/blocks/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionId, orderedBlockIds }),
      });
      if (res.ok) await fetchData();
    } catch (e) {
      console.error("Failed to reorder blocks:", e);
    }
  }

  function onBlockDrop(targetBlockId: string) {
    if (!graph || !draggingBlockId || draggingBlockId === targetBlockId) {
      setDraggingBlockId(null);
      setDropTargetBlockId(null);
      return;
    }
    const ordered = [...graph.blocks]
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map((b) => b.id);
    const from = ordered.indexOf(draggingBlockId);
    const to = ordered.indexOf(targetBlockId);
    if (from < 0 || to < 0) {
      setDraggingBlockId(null);
      setDropTargetBlockId(null);
      return;
    }
    const [moved] = ordered.splice(from, 1);
    ordered.splice(to, 0, moved);
    reorderBlocks(ordered);
    setDraggingBlockId(null);
    setDropTargetBlockId(null);
  }

  function moveBlockUp(blockId: string) {
    if (!graph || graph.transaction.status !== "DRAFT") return;
    const ordered = [...graph.blocks].sort((a, b) => a.orderIndex - b.orderIndex).map((b) => b.id);
    const index = ordered.indexOf(blockId);
    if (index <= 0) return;
    [ordered[index - 1], ordered[index]] = [ordered[index], ordered[index - 1]];
    reorderBlocks(ordered);
  }

  function moveBlockDown(blockId: string) {
    if (!graph || graph.transaction.status !== "DRAFT") return;
    const ordered = [...graph.blocks].sort((a, b) => a.orderIndex - b.orderIndex).map((b) => b.id);
    const index = ordered.indexOf(blockId);
    if (index < 0 || index >= ordered.length - 1) return;
    [ordered[index], ordered[index + 1]] = [ordered[index + 1], ordered[index]];
    reorderBlocks(ordered);
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

  async function saveAsTemplate() {
    const title = prompt("템플릿 이름을 입력하세요");
    if (!title || !title.trim()) return;
    const description = prompt("템플릿 설명 (선택)") ?? "";
    try {
      const res = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tradeId: transactionId, title: title.trim(), description: description.trim() || undefined }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.ok) {
        alert("템플릿으로 저장되었습니다.");
      } else {
        alert(json.error || "템플릿 저장에 실패했습니다.");
      }
    } catch (e) {
      console.error("Failed to save template:", e);
      alert("템플릿 저장 중 오류가 발생했습니다.");
    }
  }

  async function runBlockAction(
    blockId: string,
    action: "submit" | "approve" | "reject" | "extend" | "dispute" | "cancel",
    payload?: Record<string, unknown>
  ) {
    try {
      const res = await fetch(`/api/engine/blocks/${blockId}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload ? JSON.stringify(payload) : undefined,
      });
      if (res.ok) {
        fetchData();
        await fetchBlockReadiness(blockId);
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || `${action} failed`);
      }
    } catch (error) {
      console.error(`Failed to ${action} block:`, error);
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
    return <div className="max-w-6xl mx-auto px-4 py-6">{t.loading}</div>;
  }

  if (!graph) {
    return <div className="max-w-6xl mx-auto px-4 py-6">{t.transactionNotFound}</div>;
  }

  const isDraft = graph.transaction.status === "DRAFT";
  const txStart = graph.transaction.startDate;
  const txEnd = graph.transaction.endDate;
  const totalDays = txStart && txEnd ? daysBetween(txStart, txEnd) : 0;
  const overallDuration = txStart && txEnd
    ? `${txStart} → ${txEnd} (${totalDays} days)`
    : "Not set";

  const activeBlock = graph.blocks.find((b) => b.isActive);

  const statusColorByBlockStatus: Record<BlockStatus, string> = {
    IN_PROGRESS: "#2563eb",
    SUBMITTED: "#0ea5e9",
    REVIEWING: "#0ea5e9",
    APPROVED: "#16a34a",
    REJECTED: "#ef4444",
    EXTENDED: "#f59e0b",
    DISPUTED: "#dc2626",
    OVERDUE: "#b45309",
    CANCELLED: "#6b7280",
  };

  return (
    <main className="max-w-6xl mx-auto px-4 py-6">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
        <h1 style={{ fontSize: "2rem", marginBottom: 0, lineHeight: 1.2 }}>{t.slogan}</h1>
        <div style={{ display: "flex", gap: 12, alignItems: "center", fontSize: "0.9rem", flexWrap: "wrap" }}>
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
      <div style={{ marginBottom: 24, padding: 16, border: "1px solid #e5e7eb", borderRadius: 12, position: "relative", backgroundColor: "#fff" }}>
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
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
          <div className="text-sm text-gray-500">전체 거래 기간 (자동 계산)</div>
          <div className="font-medium text-lg">
            {(txStart || "-")} → {(txEnd || "-")}
          </div>
          <div className="text-xs text-gray-400">
            블록 기간을 기준으로 자동 설정됩니다.
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
          <span className="truncate" style={{ color: "#666", minWidth: 0 }}>{t.overallDuration}: {overallDuration}</span>
          <div className="flex flex-wrap gap-2 items-center">
            <Link
              href={`/transaction/preview/${transactionId}`}
              style={{
                padding: "8px 16px",
                minHeight: 40,
                backgroundColor: "#3b82f6",
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
            {isDraft && (
              <button
                type="button"
                onClick={saveAsTemplate}
                style={{
                  padding: "8px 16px",
                  minHeight: 40,
                  backgroundColor: "#0ea5e9",
                  color: "white",
                  border: "none",
                  borderRadius: 4,
                  cursor: "pointer",
                  fontWeight: "600",
                }}
              >
                템플릿으로 저장
              </button>
            )}
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
                minHeight: 40,
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {/* Blocks */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
              <h2 style={{ fontSize: "1.8rem" }}>{t.blocks}</h2>
              {isDraft && (
                <button
                  onClick={addBlock}
                  style={{
                    padding: "8px 16px",
                    minHeight: 40,
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

            <div style={{ display: "grid", gap: 16 }}>
              {graph.blocks.map((block, blockIndex) => {
                const policy = graph.approvalPolicies.find((p) => p.id === block.approvalPolicyId);
                const approvers = graph.blockApprovers.filter((a) => a.blockId === block.id);
                const readiness = blockReadinessByBlockId[block.id];
                const canApproveByQuestions = readiness?.ready === true;
                const approvalReason =
                  readiness?.missingRequired?.[0]?.reason ?? "필수 질문 답변이 필요합니다.";
                const currentStatus = readiness?.status ?? block.status;
                const hasAttachmentQuestion = (blockQuestionsByBlockId[block.id] ?? []).some((q) => Boolean(q.allow_attachment));
                const blockColor = BLOCK_COLORS[blockIndex % BLOCK_COLORS.length];
                const isFirst = blockIndex === 0;
                const isLast = blockIndex === graph.blocks.length - 1;

                return (
                  <div
                    key={block.id}
                    draggable={isDraft}
                    onDragStart={() => {
                      if (!isDraft) return;
                      setDraggingBlockId(block.id);
                    }}
                    onDragOver={(e) => {
                      if (!isDraft || !draggingBlockId) return;
                      e.preventDefault();
                      setDropTargetBlockId(block.id);
                    }}
                    onDrop={(e) => {
                      if (!isDraft) return;
                      e.preventDefault();
                      onBlockDrop(block.id);
                    }}
                    onDragEnd={() => {
                      setDraggingBlockId(null);
                      setDropTargetBlockId(null);
                    }}
                    style={{
                      padding: 16,
                      border: "1px solid #e5e7eb",
                      borderLeft: `4px solid ${blockColor}`,
                      borderRadius: 12,
                      backgroundColor: block.isActive ? "#f0f9ff" : "white",
                      boxShadow: dropTargetBlockId === block.id ? "0 0 0 2px #3b82f6 inset" : undefined,
                      cursor: isDraft ? "grab" : "default",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {isDraft ? (
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                            <span title="Drag to reorder block" style={{ color: "#6b7280", cursor: "grab", userSelect: "none" }}>⋮⋮</span>
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
                              style={{ flex: 1, minWidth: 0, padding: 8, fontSize: "1.1rem", fontWeight: "600", border: "1px solid #e0e0e0", borderRadius: 4 }}
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
                            <h3 className="truncate" style={{ margin: 0 }}>{tKey(block.title)}</h3>
                          </div>
                        )}
                        <div style={{ display: "flex", gap: 15, alignItems: "center", marginBottom: 10, flexWrap: "wrap" }}>
                          {isDraft ? (
                            <>
                              <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                                <input
                                  type="date"
                                  value={block.startDate}
                                  onChange={(e) => updateBlock(block.id, { startDate: e.target.value })}
                                  style={{ padding: 6, minHeight: 40, border: "1px solid #e0e0e0", borderRadius: 6 }}
                                />
                                <span>→</span>
                                <input
                                  type="date"
                                  value={block.endDate}
                                  onChange={(e) => updateBlock(block.id, { endDate: e.target.value })}
                                  style={{ padding: 6, minHeight: 40, border: "1px solid #e0e0e0", borderRadius: 6 }}
                                />
                                <span style={{ fontSize: "0.85rem", color: "#666" }}>
                                  ({daysBetween(block.startDate, block.endDate)} days)
                                </span>
                              </div>
                              <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                                <label style={{ fontSize: "0.8rem", color: "#374151" }}>Due</label>
                                <input
                                  type="date"
                                  value={block.dueDate}
                                  onChange={(e) => updateBlock(block.id, { dueDate: e.target.value })}
                                  style={{ padding: 6, minHeight: 40, border: "1px solid #e0e0e0", borderRadius: 6 }}
                                />
                                <label style={{ fontSize: "0.8rem", color: "#374151" }}>Mode</label>
                                <select
                                  value={block.approvalMode}
                                  onChange={(e) => updateBlock(block.id, { approvalMode: e.target.value as ApprovalMode })}
                                  style={{ padding: 6, minHeight: 40, border: "1px solid #e0e0e0", borderRadius: 6 }}
                                >
                                  {APPROVAL_MODES.map((mode) => (
                                    <option key={mode} value={mode} disabled={mode === "AUTO_RELEASE" && hasAttachmentQuestion}>
                                      {mode}
                                    </option>
                                  ))}
                                </select>
                                <label style={{ fontSize: "0.8rem", color: "#374151" }}>Timeout(h)</label>
                                <input
                                  type="number"
                                  min={1}
                                  value={block.reviewTimeoutHours ?? 48}
                                  onChange={(e) => updateBlock(block.id, { reviewTimeoutHours: Number(e.target.value || 48) })}
                                  style={{ padding: 6, minHeight: 40, border: "1px solid #e0e0e0", borderRadius: 6, width: 100 }}
                                />
                              </div>
                            </>
                          ) : (
                            <span style={{ fontSize: "0.9rem", color: "#666" }}>
                              {block.startDate} → {block.endDate} ({daysBetween(block.startDate, block.endDate)} days), due {block.dueDate}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 items-center">
                        {isDraft && graph.blocks.length > 1 && (
                          <div className="flex gap-2">
                            <button
                              disabled={isFirst}
                              onClick={() => moveBlockUp(block.id)}
                              className="px-3 py-2 min-h-10 text-sm bg-gray-100 rounded disabled:opacity-40"
                            >
                              ↑
                            </button>
                            <button
                              disabled={isLast}
                              onClick={() => moveBlockDown(block.id)}
                              className="px-3 py-2 min-h-10 text-sm bg-gray-100 rounded disabled:opacity-40"
                            >
                              ↓
                            </button>
                          </div>
                        )}
                        <span
                          style={{
                            padding: "4px 12px",
                            borderRadius: 4,
                            backgroundColor: canApproveByQuestions ? "#16a34a" : "#b91c1c",
                            color: "white",
                            fontSize: "0.75rem",
                            fontWeight: "700",
                          }}
                        >
                          {canApproveByQuestions ? "READY" : "NOT READY"}
                        </span>
                        <span
                          style={{
                            padding: "4px 12px",
                            borderRadius: 4,
                            backgroundColor: statusColorByBlockStatus[currentStatus],
                            color: "white",
                            fontSize: "0.85rem",
                            fontWeight: "600",
                          }}
                        >
                          {currentStatus}
                        </span>
                        {isDraft && graph.blocks.length > 1 && (
                          <button
                            onClick={() => deleteBlock(block.id)}
                            style={{
                              padding: "8px 12px",
                              minHeight: 40,
                              backgroundColor: "#ef4444",
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
                    <div style={{ marginBottom: 12, padding: 10, backgroundColor: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 8 }}>
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
                          padding: 8,
                          minHeight: 40,
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
                    <div style={{ marginBottom: 12, padding: 10, backgroundColor: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 8 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                        <label style={{ fontSize: "0.9rem", fontWeight: "600" }}>{t.approvers}:</label>
                        {isDraft && addApproverBlockId !== block.id && (
                          <button
                            type="button"
                            onClick={() => setAddApproverBlockId(block.id)}
                            style={{
                              padding: "8px 12px",
                              minHeight: 40,
                              backgroundColor: "#3b82f6",
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
                            style={{ padding: 8, minHeight: 40, border: "1px solid #e0e0e0", borderRadius: 6, fontSize: "0.9rem" }}
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
                            style={{ padding: 8, minHeight: 40, border: "1px solid #e0e0e0", borderRadius: 6, fontSize: "0.9rem", minWidth: 140 }}
                          />
                          <button
                            type="button"
                            onClick={() => addApprover(block.id, addApproverRole, addApproverDisplayName, true)}
                            style={{
                              padding: "8px 12px",
                              minHeight: 40,
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
                              padding: "8px 12px",
                              minHeight: 40,
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
                                    padding: "6px 10px",
                                    minHeight: 36,
                                    backgroundColor: "#ef4444",
                                    color: "white",
                                    border: "none",
                                    borderRadius: 4,
                                    cursor: "pointer",
                                    fontSize: "0.8rem",
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

                    <BlockQuestionBuilder
                      blockId={block.id}
                      isDraft={isDraft}
                      questions={blockQuestionsByBlockId[block.id] ?? []}
                      onAddQuestion={addQuestion}
                      onUpdateQuestion={updateQuestion}
                      onDeleteQuestion={deleteQuestion}
                      onReorderQuestions={reorderQuestions}
                      onDuplicateQuestion={duplicateQuestion}
                      t={{
                        blockQuestions: t.blockQuestions,
                        addQuestion: t.addQuestion,
                        required: t.required,
                        questionLabel: t.questionLabel,
                        questionDescription: t.questionDescription,
                        options: t.options,
                        delete: t.delete,
                        noQuestionsYet: t.noQuestionsYet,
                        datePickerNote: t.datePickerNote,
                        fileUploadPlaceholder: t.fileUploadPlaceholder,
                      }}
                    />

                    {block.extensions.length > 0 && (
                      <details style={{ marginTop: 12, border: "1px solid #e5e7eb", borderRadius: 8, padding: 10 }}>
                        <summary style={{ cursor: "pointer", fontWeight: 600 }}>연장 이력 ({block.extensions.length})</summary>
                        <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
                          {block.extensions.map((ext, idx) => (
                            <div key={`${block.id}-ext-${idx}`} style={{ fontSize: "0.85rem", color: "#374151" }}>
                              {ext.previousDueDate} → {ext.newDueDate} ({ext.decidedBy}) {ext.reason ? `- ${ext.reason}` : ""}
                            </div>
                          ))}
                        </div>
                      </details>
                    )}

                    {block.isActive && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {["IN_PROGRESS", "OVERDUE", "EXTENDED"].includes(currentStatus) && (
                          <button
                            onClick={() => runBlockAction(block.id, "submit")}
                            disabled={!canApproveByQuestions}
                            title={canApproveByQuestions ? "" : approvalReason}
                            style={{
                              padding: "8px 12px",
                              minHeight: 40,
                              backgroundColor: canApproveByQuestions ? "#2563eb" : "#9ca3af",
                              color: "white",
                              border: "none",
                              borderRadius: 6,
                              cursor: canApproveByQuestions ? "pointer" : "not-allowed",
                            }}
                          >
                            Submit
                          </button>
                        )}
                        {["SUBMITTED", "REVIEWING"].includes(currentStatus) && (
                          <>
                            <button
                              onClick={() => runBlockAction(block.id, "approve")}
                              disabled={!canApproveByQuestions}
                              style={{ padding: "8px 12px", minHeight: 40, backgroundColor: "#16a34a", color: "white", border: "none", borderRadius: 6 }}
                            >
                              {t.approveBlock}
                            </button>
                            <button
                              onClick={() => {
                                const reason = prompt("Reject reason") || "";
                                void runBlockAction(block.id, "reject", { reason });
                              }}
                              style={{ padding: "8px 12px", minHeight: 40, backgroundColor: "#ef4444", color: "white", border: "none", borderRadius: 6 }}
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {["IN_PROGRESS", "OVERDUE", "EXTENDED", "SUBMITTED", "REVIEWING"].includes(currentStatus) && (
                          <>
                            <button
                              onClick={() => {
                                const reason = prompt("Dispute reason") || "";
                                void runBlockAction(block.id, "dispute", { reason });
                              }}
                              style={{ padding: "8px 12px", minHeight: 40, backgroundColor: "#dc2626", color: "white", border: "none", borderRadius: 6 }}
                            >
                              Dispute
                            </button>
                            <button
                              onClick={() => {
                                const newDueDate = prompt("New due date (YYYY-MM-DD)", block.dueDate);
                                if (!newDueDate) return;
                                const reason = prompt("Extension reason") || "";
                                void runBlockAction(block.id, "extend", { newDueDate, reason, decidedBy: "BUYER" });
                              }}
                              style={{ padding: "8px 12px", minHeight: 40, backgroundColor: "#f59e0b", color: "white", border: "none", borderRadius: 6 }}
                            >
                              Extend
                            </button>
                            <button
                              onClick={() => {
                                const reason = prompt("Cancel reason") || "";
                                void runBlockAction(block.id, "cancel", { reason });
                              }}
                              style={{ padding: "8px 12px", minHeight: 40, backgroundColor: "#6b7280", color: "white", border: "none", borderRadius: 6 }}
                            >
                              Cancel
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Timeline: 설계 결과를 “실제 날짜 기준으로 어떻게 흘러가는지” 한눈에 보는 시각화. 읽기 전용. */}
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: "1.8rem", marginBottom: 16 }}>{t.timeline}</h2>
            {!txStart || !txEnd ? (
              <p style={{ color: "#666", textAlign: "center", padding: 16, border: "1px solid #e5e7eb", borderRadius: 8 }}>
                블록 날짜를 설정하면 캘린더가 표시됩니다.
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
        <div className="lg:sticky lg:top-4 h-fit">
          <h3 style={{ fontSize: "1.2rem", marginBottom: 12 }}>{t.activityLog}</h3>
          <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 12, maxHeight: "600px", overflowY: "auto", backgroundColor: "#fff" }}>
            {logs.length === 0 ? (
              <p style={{ color: "#666", fontSize: "0.9rem" }}>No activity yet</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {logs.map((log) => (
                  <div
                    key={log.id}
                    style={{
                      padding: 10,
                      borderLeft: "3px solid #3b82f6",
                      backgroundColor: "#f9fafb",
                      borderRadius: 8,
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
