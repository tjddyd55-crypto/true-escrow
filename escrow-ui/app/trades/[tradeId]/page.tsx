"use client";

import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

type Role = "BUYER" | "SELLER" | "VERIFIER";
type ConditionType = "CHECK" | "FILE_UPLOAD" | "TEXT" | "NUMBER" | "DATE";
type ConditionStatus = "PENDING" | "SUBMITTED" | "CONFIRMED" | "REJECTED";
type BlockStatus = "DRAFT" | "IN_PROGRESS" | "READY_FOR_FINAL_APPROVAL" | "APPROVED" | "DISPUTED" | "ON_HOLD";
type ConditionAnswer = { text: string; attachments: string[] };
type StepperStatus = "DRAFT" | "ACTIVE" | "IN_PROGRESS" | "READY_FOR_FINAL_APPROVAL" | "COMPLETED";
type SummaryActionType = "TASK" | "APPROVAL" | "FINAL";

type TradeDetail = {
  trade: { id: string; title: string; description?: string | null; createdBy: string; createdAt: string; status?: string };
  participants: Array<{ id: string; userId?: string | null; role: Role; status: "INVITED" | "ACCEPTED" | "DECLINED"; inviteType: "EMAIL" | "PHONE"; inviteTarget: string }>;
  blocks: Array<{ id: string; title: string; startDate?: string | null; dueDate: string; approvalType: "MANUAL" | "SIMPLE"; finalApproverRole: Role; watchers: Role[]; extendedDueDate?: string | null; status: BlockStatus }>;
  conditions: Array<{
    id: string;
    blockId: string;
    title: string;
    description?: string | null;
    type: ConditionType;
    required: boolean;
    assignedRole: Role;
    confirmerRole: Role;
    status: ConditionStatus;
    rejectReason?: string | null;
    answerJson?: ConditionAnswer | null;
  }>;
};

type TradeSummary = {
  trade: { id: string; title: string; status: string; kind: "MVP" | "ENGINE" };
  participantRole: Role | null;
  stepperStatus: StepperStatus;
  blocks: Array<{
    id: string;
    title: string;
    dueDate: string;
    extendedDueDate: string | null;
    status: string;
    requiredCount: number;
    confirmedCount: number;
    submittedCount: number;
    rejectedCount: number;
    progressPct: number;
    myTasksCount: number;
    myApprovalsCount: number;
  }>;
  myNextActions: Array<{
    type: SummaryActionType;
    blockId: string;
    conditionId?: string;
    title: string;
    dueDate: string | null;
  }>;
};

type Tab = "overview" | "blocks" | "participants";
const ROLES: Role[] = ["BUYER", "SELLER", "VERIFIER"];
const CONDITION_TYPES: ConditionType[] = ["CHECK", "FILE_UPLOAD", "TEXT", "NUMBER", "DATE"];
const STATUS_ORDER: Record<ConditionStatus, number> = {
  REJECTED: 0,
  PENDING: 1,
  SUBMITTED: 2,
  CONFIRMED: 3,
};

type LocalAttachment = { id: string; name: string; url: string; previewUrl: string };

const STATUS_STYLE: Record<ConditionStatus, string> = {
  PENDING: "bg-blue-100 text-blue-800",
  SUBMITTED: "bg-violet-100 text-violet-800",
  REJECTED: "bg-red-100 text-red-800",
  CONFIRMED: "bg-green-100 text-green-800",
};

const STEPS: StepperStatus[] = ["DRAFT", "ACTIVE", "IN_PROGRESS", "READY_FOR_FINAL_APPROVAL", "COMPLETED"];

function StatusStepper({ current }: { current: StepperStatus }) {
  const currentIndex = STEPS.indexOf(current);
  return (
    <div className="border rounded-lg p-4 bg-white">
      <h2 className="font-semibold mb-3">거래 진행 상태</h2>
      <div className="hidden md:flex items-center gap-2">
        {STEPS.map((step, index) => {
          const done = index < currentIndex;
          const active = index === currentIndex;
          return (
            <div key={step} className="flex items-center gap-2 flex-1 min-w-0">
              <div
                className={`w-7 h-7 rounded-full text-xs flex items-center justify-center font-semibold ${
                  done
                    ? "bg-green-600 text-white"
                    : active
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-500"
                }`}
              >
                {done ? "✓" : index + 1}
              </div>
              <div className={`text-xs truncate ${active ? "text-blue-700 font-semibold" : done ? "text-green-700" : "text-gray-500"}`}>
                {step}
              </div>
              {index < STEPS.length - 1 ? <div className="h-px bg-gray-300 flex-1" /> : null}
            </div>
          );
        })}
      </div>
      <div className="md:hidden space-y-1">
        {STEPS.map((step, index) => {
          const done = index < currentIndex;
          const active = index === currentIndex;
          return (
            <div key={step} className="flex items-center gap-2 text-sm">
              <span className={`w-2 h-2 rounded-full ${done ? "bg-green-600" : active ? "bg-blue-600" : "bg-gray-300"}`} />
              <span className={active ? "font-semibold text-blue-700" : done ? "text-green-700" : "text-gray-500"}>{step}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const ConditionCard = memo(function ConditionCard(props: {
  condition: TradeDetail["conditions"][number];
  blockDueDate: string;
  myRole: Role | null;
  loading: boolean;
  tradeId: string;
  blockId: string;
  onSubmit: (conditionId: string, isResubmit: boolean, answer: ConditionAnswer) => Promise<void>;
  onConfirm: (conditionId: string) => Promise<void>;
  onReject: (conditionId: string) => Promise<void>;
}) {
  const { condition, blockDueDate, myRole, loading, tradeId, blockId, onSubmit, onConfirm, onReject } = props;
  const [text, setText] = useState("");
  const [attachments, setAttachments] = useState<LocalAttachment[]>([]);

  const isWriter = myRole === condition.assignedRole;
  const isConfirmer = myRole === condition.confirmerRole;
  const canWrite = isWriter && (condition.status === "PENDING" || condition.status === "REJECTED");
  const canConfirm = isConfirmer && condition.status === "SUBMITTED";
  const isFileType = condition.type === "FILE_UPLOAD";
  const hasContent = isFileType ? attachments.length > 0 : text.trim().length > 0 || attachments.length > 0;
  const submitDisabled = loading || (condition.required && !hasContent);

  useEffect(() => {
    const initial = condition.answerJson ?? { text: "", attachments: [] };
    setText(initial.text ?? "");
    setAttachments(
      (initial.attachments ?? []).map((url, index) => ({
        id: `${condition.id}-${index}-${url}`,
        name: url.split("/").pop() || "attachment",
        url,
        previewUrl: url,
      }))
    );
  }, [condition.id, condition.answerJson]);

  async function onPickFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const next: LocalAttachment[] = [];
    for (const file of Array.from(files)) {
      const uploadRes = await fetch(`/api/engine/trades/${tradeId}/blocks/${blockId}/attachments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: condition.id,
          fileName: file.name,
          mime: file.type || null,
          size: file.size,
          uploaderRole: myRole ?? "BUYER",
        }),
      });
      const uploadJson = await uploadRes.json().catch(() => ({}));
      if (!uploadRes.ok || !uploadJson.ok || !uploadJson.data?.url) {
        throw new Error(uploadJson.error ?? "파일 업로드 메타데이터 저장에 실패했습니다.");
      }
      next.push({
        id: uploadJson.data.id ?? `${file.name}-${Date.now()}`,
        name: file.name,
        url: uploadJson.data.url,
        previewUrl: uploadJson.data.url,
      });
    }
    setAttachments((prev) => [...prev, ...next]);
  }

  function removeAttachment(id: string) {
    setAttachments((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((item) => item.id !== id);
    });
  }

  useEffect(
    () => () => {
      attachments
        .filter((item) => item.previewUrl.startsWith("blob:"))
        .forEach((item) => URL.revokeObjectURL(item.previewUrl));
    },
    [attachments]
  );

  return (
    <article id={`condition-${condition.id}`} className="border rounded-lg p-4 bg-white space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className={`inline-flex text-xs px-2 py-1 rounded font-semibold ${STATUS_STYLE[condition.status]}`}>
            {condition.status}
          </div>
          <h4 className="font-semibold mt-2">
            {condition.title}{" "}
            {condition.required ? <span className="text-xs text-red-600">(Required)</span> : <span className="text-xs text-gray-500">(Optional)</span>}
          </h4>
          {condition.description ? <p className="text-sm text-gray-600 mt-1">{condition.description}</p> : null}
        </div>
        <div className="text-xs text-gray-600 text-right min-w-[170px] space-y-1">
          <div>Assigned: {condition.assignedRole}</div>
          <div>Confirmer: {condition.confirmerRole}</div>
          <div>Required: {condition.required ? "Yes" : "No"}</div>
          <div>
            내 역할:{" "}
            {isWriter ? "작성자" : isConfirmer ? "검증자" : myRole ?? "미참여"}
          </div>
        </div>
      </div>

      {condition.status === "REJECTED" ? (
        <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-700">
          <div>반려 사유: {condition.rejectReason || "-"}</div>
          <div>새 마감일: {blockDueDate}</div>
        </div>
      ) : null}

      <div className="border-t pt-3">
        {isFileType ? (
          <div className="space-y-2">
            <input
              type="file"
              multiple
              disabled={!canWrite || loading}
              onChange={(e) => void onPickFiles(e.target.files).catch((err) => alert(err instanceof Error ? err.message : "Upload failed"))}
            />
            {attachments.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {attachments.map((file) => (
                  <div key={file.id} className="border rounded p-2">
                    <img src={file.previewUrl} alt={file.name} className="w-full h-20 object-cover rounded" />
                    <div className="text-xs mt-1 truncate">{file.name}</div>
                    {canWrite ? (
                      <button type="button" className="text-xs text-red-600 mt-1" onClick={() => removeAttachment(file.id)}>
                        제거
                      </button>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">첨부 파일이 없습니다.</p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <textarea
              className="w-full border rounded p-2 min-h-[120px] disabled:bg-gray-50"
              placeholder="조건 내용을 작성하세요."
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={!canWrite || loading}
            />
            {attachments.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {attachments.map((file) => (
                  <div key={file.id} className="border rounded p-2">
                    <img src={file.previewUrl} alt={file.name} className="w-full h-20 object-cover rounded" />
                    <div className="text-xs mt-1 truncate">{file.name}</div>
                    {canWrite ? (
                      <button type="button" className="text-xs text-red-600 mt-1" onClick={() => removeAttachment(file.id)}>
                        제거
                      </button>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        )}
      </div>

      <div className="border-t pt-3 flex justify-end gap-2">
        {isWriter && condition.status === "PENDING" ? (
          <button
            className="px-3 py-2 rounded bg-blue-600 text-white disabled:opacity-50"
            disabled={submitDisabled}
            onClick={() =>
              void onSubmit(condition.id, false, {
                text,
                attachments: attachments.map((item) => item.url),
              })
            }
          >
            제출하기
          </button>
        ) : null}
        {isWriter && condition.status === "REJECTED" ? (
          <button
            className="px-3 py-2 rounded bg-blue-600 text-white disabled:opacity-50"
            disabled={submitDisabled}
            onClick={() =>
              void onSubmit(condition.id, true, {
                text,
                attachments: attachments.map((item) => item.url),
              })
            }
          >
            수정 후 재제출
          </button>
        ) : null}
        {canConfirm ? (
          <>
            <button
              className="px-3 py-2 rounded bg-green-600 text-white disabled:opacity-50"
              disabled={loading}
              onClick={() => void onConfirm(condition.id)}
            >
              승인
            </button>
            <button
              className="px-3 py-2 rounded bg-red-600 text-white disabled:opacity-50"
              disabled={loading}
              onClick={() => void onReject(condition.id)}
            >
              반려
            </button>
          </>
        ) : null}
      </div>
    </article>
  );
});

export default function TradeDetailPage() {
  const params = useParams();
  const tradeId = (params.tradeId ?? params.id) as string;
  const [tab, setTab] = useState<Tab>("overview");
  const [detail, setDetail] = useState<TradeDetail | null>(null);
  const [summary, setSummary] = useState<TradeSummary | null>(null);
  const [me, setMe] = useState<{ id: string } | null>(null);
  const [inviteForm, setInviteForm] = useState({ inviteType: "EMAIL", inviteTarget: "", role: "SELLER" as Role });
  const [blockDraft, setBlockDraft] = useState<{
    title: string;
    startDate: string;
    dueDate: string;
    approvalType: "MANUAL" | "SIMPLE";
    finalApproverRole: Role;
    watchers: string;
  }>({
    title: "",
    startDate: "",
    dueDate: "",
    approvalType: "MANUAL",
    finalApproverRole: "BUYER" as Role,
    watchers: "" as string,
  });
  const [blockEditById, setBlockEditById] = useState<Record<string, { title: string; startDate: string; dueDate: string; approvalType: "MANUAL" | "SIMPLE"; finalApproverRole: Role; watchers: string }>>({});
  const [conditionDraftByBlockId, setConditionDraftByBlockId] = useState<
    Record<string, { title: string; description: string; type: ConditionType; required: boolean; assignedRole: Role; confirmerRole: Role }>
  >({});
  const [conditionActionLoadingId, setConditionActionLoadingId] = useState<string | null>(null);

  useEffect(() => {
    void load();
  }, [tradeId]);

  async function load() {
    const [meRes, detailRes, summaryRes] = await Promise.all([
      fetch("/api/me"),
      fetch(`/api/trades/${tradeId}`),
      fetch(`/api/transactions/${tradeId}/summary`),
    ]);
    const meJson = await meRes.json().catch(() => ({}));
    const detailJson = await detailRes.json().catch(() => ({}));
    const summaryJson = await summaryRes.json().catch(() => ({}));
    setMe(meJson.ok ? meJson.data : null);
    if (detailRes.ok && detailJson.ok) {
      setDetail(detailJson.data);
      const nextEdit: Record<string, { title: string; startDate: string; dueDate: string; approvalType: "MANUAL" | "SIMPLE"; finalApproverRole: Role; watchers: string }> = {};
      for (const b of detailJson.data.blocks ?? []) {
        nextEdit[b.id] = {
          title: b.title,
          startDate: b.startDate ?? "",
          dueDate: b.dueDate,
          approvalType: b.approvalType ?? "MANUAL",
          finalApproverRole: b.finalApproverRole,
          watchers: Array.isArray(b.watchers) ? b.watchers.join(",") : "",
        };
      }
      setBlockEditById(nextEdit);
    }
    setSummary(summaryRes.ok && summaryJson.ok ? (summaryJson.data as TradeSummary) : null);
  }

  async function refreshSummary() {
    const res = await fetch(`/api/transactions/${tradeId}/summary`);
    const json = await res.json().catch(() => ({}));
    if (res.ok && json.ok) setSummary(json.data as TradeSummary);
  }

  const myRole = useMemo(() => {
    if (!detail || !me) return null;
    return detail.participants.find((p) => p.userId === me.id && p.status === "ACCEPTED")?.role ?? null;
  }, [detail, me]);

  async function callAction(url: string, body?: Record<string, unknown>) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.ok) throw new Error(json.error ?? "Action failed");
    return json.data;
  }

  async function createInvite() {
    try {
      const data = await callAction(`/api/trades/${tradeId}/invites`, inviteForm as unknown as Record<string, unknown>);
      alert(`Invite URL: ${data.inviteUrl}`);
      setInviteForm({ inviteType: "EMAIL", inviteTarget: "", role: "SELLER" });
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Invite failed");
    }
  }

  async function createBlock() {
    try {
      await callAction(`/api/trades/${tradeId}/blocks`, {
        ...blockDraft,
        watchers: blockDraft.watchers
          .split(",")
          .map((v) => v.trim())
          .filter(Boolean),
      });
      setBlockDraft({ title: "", startDate: "", dueDate: "", approvalType: "MANUAL", finalApproverRole: "BUYER", watchers: "" });
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Create block failed");
    }
  }

  async function saveBlock(blockId: string) {
    try {
      const draft = blockEditById[blockId];
      await fetch(`/api/trades/${tradeId}/blocks/${blockId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...draft,
          watchers: draft.watchers.split(",").map((v) => v.trim()).filter(Boolean),
        }),
      }).then(async (res) => {
        const json = await res.json().catch(() => ({}));
        if (!res.ok || !json.ok) throw new Error(json.error ?? "Save block failed");
      });
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Save block failed");
    }
  }

  async function addCondition(blockId: string) {
    const draft = conditionDraftByBlockId[blockId] ?? {
      title: "",
      description: "",
      type: "CHECK" as const,
      required: true,
      assignedRole: "SELLER" as Role,
      confirmerRole: "BUYER" as Role,
    };
    try {
      await callAction(`/api/trades/${tradeId}/blocks/${blockId}/conditions`, draft as unknown as Record<string, unknown>);
      setConditionDraftByBlockId((prev) => ({
        ...prev,
        [blockId]: { title: "", description: "", type: "CHECK", required: true, assignedRole: "SELLER", confirmerRole: "BUYER" },
      }));
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Add condition failed");
    }
  }

  function patchConditionStatus(conditionId: string, patch: Partial<TradeDetail["conditions"][number]>) {
    setDetail((prev) =>
      prev
        ? {
            ...prev,
            conditions: prev.conditions.map((item) => (item.id === conditionId ? { ...item, ...patch } : item)),
          }
        : prev
    );
  }

  async function submitCondition(blockId: string, conditionId: string, isResubmit: boolean, answer: ConditionAnswer) {
    try {
      setConditionActionLoadingId(conditionId);
      const data = await callAction(
        `/api/trades/${tradeId}/blocks/${blockId}/conditions/${conditionId}/${isResubmit ? "resubmit" : "submit"}`
        ,
        { answer }
      );
      patchConditionStatus(conditionId, {
        status: "SUBMITTED",
        rejectReason: null,
        answerJson: data?.answer ?? answer,
      });
      await refreshSummary();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Submit failed");
    } finally {
      setConditionActionLoadingId(null);
    }
  }

  async function confirmCondition(blockId: string, conditionId: string) {
    try {
      setConditionActionLoadingId(conditionId);
      await callAction(`/api/trades/${tradeId}/blocks/${blockId}/conditions/${conditionId}/confirm`);
      patchConditionStatus(conditionId, { status: "CONFIRMED" });
      await refreshSummary();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Confirm failed");
    } finally {
      setConditionActionLoadingId(null);
    }
  }

  async function rejectCondition(blockId: string, conditionId: string) {
    const rejectReason = prompt("Reject reason");
    if (!rejectReason) return;
    const newDueDate = prompt("New due date (YYYY-MM-DD)");
    if (!newDueDate) return;
    try {
      setConditionActionLoadingId(conditionId);
      await callAction(`/api/trades/${tradeId}/blocks/${blockId}/conditions/${conditionId}/reject`, { rejectReason, newDueDate });
      patchConditionStatus(conditionId, { status: "REJECTED", rejectReason });
      await refreshSummary();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Reject failed");
    } finally {
      setConditionActionLoadingId(null);
    }
  }

  async function finalApprove(blockId: string) {
    try {
      await callAction(`/api/trades/${tradeId}/blocks/${blockId}/final-approve`);
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Final approve failed");
    }
  }

  const submitConditionForBlock = useCallback(
    async (blockId: string, conditionId: string, isResubmit: boolean, answer: ConditionAnswer) =>
      submitCondition(blockId, conditionId, isResubmit, answer),
    [tradeId]
  );
  const confirmConditionForBlock = useCallback(
    async (blockId: string, conditionId: string) => confirmCondition(blockId, conditionId),
    [tradeId]
  );
  const rejectConditionForBlock = useCallback(
    async (blockId: string, conditionId: string) => rejectCondition(blockId, conditionId),
    [tradeId]
  );

  const summaryByBlockId = useMemo(() => {
    const next = new Map<string, TradeSummary["blocks"][number]>();
    for (const block of summary?.blocks ?? []) next.set(block.id, block);
    return next;
  }, [summary]);

  function focusAction(action: TradeSummary["myNextActions"][number]) {
    const targetId = action.conditionId ? `condition-${action.conditionId}` : `block-${action.blockId}`;
    const el = document.getElementById(targetId);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  if (!detail) return <main className="max-w-6xl mx-auto p-6">Loading...</main>;

  return (
    <main className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-2">{detail.trade.title}</h1>
      {detail.trade.description && <p className="text-gray-600 mb-4">{detail.trade.description}</p>}

      {summary ? (
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <div className="lg:col-span-2">
            <StatusStepper current={summary.stepperStatus} />
          </div>
          <aside className="border rounded-lg p-4 bg-white lg:sticky lg:top-20 h-fit">
            <h2 className="font-semibold mb-2">📌 내가 지금 해야 할 일</h2>
            {summary.myNextActions.length === 0 ? (
              <p className="text-sm text-gray-500">현재 처리할 작업이 없습니다.</p>
            ) : (
              <div className="space-y-2">
                {summary.myNextActions.map((action, idx) => (
                  <button
                    key={`${action.type}-${action.blockId}-${action.conditionId ?? idx}`}
                    type="button"
                    className="w-full text-left border rounded p-2 hover:bg-gray-50"
                    onClick={() => focusAction(action)}
                  >
                    <div className="text-xs text-gray-500">{action.type}</div>
                    <div className="font-medium text-sm">{action.title}</div>
                    {action.dueDate ? <div className="text-xs text-gray-600">마감: {action.dueDate}</div> : null}
                  </button>
                ))}
              </div>
            )}
          </aside>
        </section>
      ) : null}

      <div className="flex gap-2 mb-6">
        <button className={`px-3 py-2 rounded ${tab === "overview" ? "bg-blue-600 text-white" : "border"}`} onClick={() => setTab("overview")}>Overview</button>
        <button className={`px-3 py-2 rounded ${tab === "blocks" ? "bg-blue-600 text-white" : "border"}`} onClick={() => setTab("blocks")}>Blocks</button>
        <button className={`px-3 py-2 rounded ${tab === "participants" ? "bg-blue-600 text-white" : "border"}`} onClick={() => setTab("participants")}>Participants</button>
      </div>

      {tab === "overview" && (
        <section className="space-y-2">
          <p className="text-sm text-gray-600">Trade ID: {detail.trade.id}</p>
          <p className="text-sm text-gray-600">내 역할: {myRole ?? "참여 전"}</p>
          <p className="text-sm text-gray-600">Trade Status: {detail.trade.status ?? "DRAFT"}</p>
        </section>
      )}

      {tab === "participants" && (
        <section className="space-y-4">
          <div className="border rounded p-4 space-y-2">
            <h2 className="font-semibold">Invite Participant</h2>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
              <select className="border rounded p-2" value={inviteForm.inviteType} onChange={(e) => setInviteForm((p) => ({ ...p, inviteType: e.target.value }))}>
                <option value="EMAIL">EMAIL</option>
                <option value="PHONE">PHONE</option>
              </select>
              <input className="border rounded p-2 sm:col-span-2" placeholder="target" value={inviteForm.inviteTarget} onChange={(e) => setInviteForm((p) => ({ ...p, inviteTarget: e.target.value }))} />
              <select className="border rounded p-2" value={inviteForm.role} onChange={(e) => setInviteForm((p) => ({ ...p, role: e.target.value as Role }))}>
                {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <button className="px-3 py-2 rounded bg-blue-600 text-white" onClick={createInvite}>Create Invite</button>
          </div>
          <div className="space-y-2">
            {detail.participants.map((p) => (
              <div key={p.id} className="border rounded p-3 text-sm">
                {p.role} / {p.status} / {p.inviteType} / {p.inviteTarget} {p.userId ? `(user: ${p.userId})` : "(unlinked)"}
              </div>
            ))}
          </div>
        </section>
      )}

      {tab === "blocks" && (
        <section className="space-y-6">
          <div className="border rounded p-4 space-y-2">
            <h2 className="font-semibold">Create Block</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input className="border rounded p-2" placeholder="title" value={blockDraft.title} onChange={(e) => setBlockDraft((p) => ({ ...p, title: e.target.value }))} />
              <input className="border rounded p-2" type="date" value={blockDraft.startDate} onChange={(e) => setBlockDraft((p) => ({ ...p, startDate: e.target.value }))} />
              <input className="border rounded p-2" type="date" value={blockDraft.dueDate} onChange={(e) => setBlockDraft((p) => ({ ...p, dueDate: e.target.value }))} />
              <select className="border rounded p-2" value={blockDraft.approvalType} onChange={(e) => setBlockDraft((p) => ({ ...p, approvalType: e.target.value as "MANUAL" | "SIMPLE" }))}>
                <option value="MANUAL">MANUAL</option>
                <option value="SIMPLE">SIMPLE</option>
              </select>
              <select className="border rounded p-2" value={blockDraft.finalApproverRole} onChange={(e) => setBlockDraft((p) => ({ ...p, finalApproverRole: e.target.value as Role }))}>
                {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
              <input className="border rounded p-2" placeholder="watchers (comma roles)" value={blockDraft.watchers} onChange={(e) => setBlockDraft((p) => ({ ...p, watchers: e.target.value }))} />
            </div>
            <button className="px-3 py-2 rounded bg-blue-600 text-white" onClick={createBlock}>Create</button>
          </div>

          {detail.blocks.map((block) => {
            const conditions = [...detail.conditions.filter((c) => c.blockId === block.id)].sort(
              (a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]
            );
            const blockSummary = summaryByBlockId.get(block.id);
            const canFinalApprove = myRole === block.finalApproverRole && block.status === "READY_FOR_FINAL_APPROVAL";
            return (
              <div id={`block-${block.id}`} key={block.id} className="border rounded p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-1 rounded bg-gray-100">{block.status}</span>
                  <span className="text-sm text-gray-600">Due Date: {block.dueDate}</span>
                  {block.extendedDueDate ? <span className="text-sm text-red-600">연기됨: {block.extendedDueDate}</span> : null}
                </div>
                {blockSummary ? (
                  <div className="space-y-1">
                    <div className="text-xs text-gray-600">
                      Confirmed {blockSummary.confirmedCount} / Required {blockSummary.requiredCount} ({blockSummary.progressPct}%)
                    </div>
                    <div className="h-2 bg-gray-200 rounded">
                      <div className="h-2 bg-green-500 rounded" style={{ width: `${blockSummary.progressPct}%` }} />
                    </div>
                    <div className="text-xs text-gray-500">
                      SUBMITTED {blockSummary.submittedCount} / REJECTED {blockSummary.rejectedCount}
                    </div>
                  </div>
                ) : null}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input className="border rounded p-2" value={blockEditById[block.id]?.title ?? ""} onChange={(e) => setBlockEditById((prev) => ({ ...prev, [block.id]: { ...prev[block.id], title: e.target.value } }))} />
                  <input className="border rounded p-2" type="date" value={blockEditById[block.id]?.startDate ?? ""} onChange={(e) => setBlockEditById((prev) => ({ ...prev, [block.id]: { ...prev[block.id], startDate: e.target.value } }))} />
                  <input className="border rounded p-2" type="date" value={blockEditById[block.id]?.dueDate ?? ""} onChange={(e) => setBlockEditById((prev) => ({ ...prev, [block.id]: { ...prev[block.id], dueDate: e.target.value } }))} />
                  <select className="border rounded p-2" value={blockEditById[block.id]?.approvalType ?? "MANUAL"} onChange={(e) => setBlockEditById((prev) => ({ ...prev, [block.id]: { ...prev[block.id], approvalType: e.target.value as "MANUAL" | "SIMPLE" } }))}>
                    <option value="MANUAL">MANUAL</option>
                    <option value="SIMPLE">SIMPLE</option>
                  </select>
                  <select className="border rounded p-2" value={blockEditById[block.id]?.finalApproverRole ?? "BUYER"} onChange={(e) => setBlockEditById((prev) => ({ ...prev, [block.id]: { ...prev[block.id], finalApproverRole: e.target.value as Role } }))}>
                    {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                  <input className="border rounded p-2" value={blockEditById[block.id]?.watchers ?? ""} placeholder="watchers csv" onChange={(e) => setBlockEditById((prev) => ({ ...prev, [block.id]: { ...prev[block.id], watchers: e.target.value } }))} />
                </div>
                <button className="px-3 py-2 rounded bg-gray-800 text-white" onClick={() => saveBlock(block.id)}>Save</button>

                <div className="border rounded p-3 space-y-2">
                  <h3 className="font-medium">Conditions</h3>
                  {conditions.length === 0 ? <p className="text-sm text-gray-500">No conditions yet</p> : (
                    <div className="space-y-2">
                      {conditions.map((c) => {
                        return (
                          <ConditionCard
                            key={c.id}
                            condition={c}
                            tradeId={tradeId}
                            blockId={block.id}
                            blockDueDate={block.extendedDueDate ?? block.dueDate}
                            myRole={myRole}
                            loading={conditionActionLoadingId === c.id}
                            onSubmit={(conditionId, isResubmit, answer) => submitConditionForBlock(block.id, conditionId, isResubmit, answer)}
                            onConfirm={(conditionId) => confirmConditionForBlock(block.id, conditionId)}
                            onReject={(conditionId) => rejectConditionForBlock(block.id, conditionId)}
                          />
                        );
                      })}
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-6 gap-2">
                    <input className="border rounded p-2 sm:col-span-2" placeholder="condition title" value={conditionDraftByBlockId[block.id]?.title ?? ""} onChange={(e) => setConditionDraftByBlockId((prev) => ({ ...prev, [block.id]: { ...(prev[block.id] ?? { title: "", description: "", type: "CHECK", required: true, assignedRole: "SELLER", confirmerRole: "BUYER" }), title: e.target.value } }))} />
                    <select className="border rounded p-2" value={conditionDraftByBlockId[block.id]?.type ?? "CHECK"} onChange={(e) => setConditionDraftByBlockId((prev) => ({ ...prev, [block.id]: { ...(prev[block.id] ?? { title: "", description: "", type: "CHECK", required: true, assignedRole: "SELLER", confirmerRole: "BUYER" }), type: e.target.value as ConditionType } }))}>
                      {CONDITION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <select className="border rounded p-2" value={conditionDraftByBlockId[block.id]?.assignedRole ?? "SELLER"} onChange={(e) => setConditionDraftByBlockId((prev) => ({ ...prev, [block.id]: { ...(prev[block.id] ?? { title: "", description: "", type: "CHECK", required: true, assignedRole: "SELLER", confirmerRole: "BUYER" }), assignedRole: e.target.value as Role } }))}>
                      {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                    <select className="border rounded p-2" value={conditionDraftByBlockId[block.id]?.confirmerRole ?? "BUYER"} onChange={(e) => setConditionDraftByBlockId((prev) => ({ ...prev, [block.id]: { ...(prev[block.id] ?? { title: "", description: "", type: "CHECK", required: true, assignedRole: "SELLER", confirmerRole: "BUYER" }), confirmerRole: e.target.value as Role } }))}>
                      {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={conditionDraftByBlockId[block.id]?.required ?? true} onChange={(e) => setConditionDraftByBlockId((prev) => ({ ...prev, [block.id]: { ...(prev[block.id] ?? { title: "", description: "", type: "CHECK", required: true, assignedRole: "SELLER", confirmerRole: "BUYER" }), required: e.target.checked } }))} />
                      Required
                    </label>
                  </div>
                  <textarea className="w-full border rounded p-2" rows={2} placeholder="description" value={conditionDraftByBlockId[block.id]?.description ?? ""} onChange={(e) => setConditionDraftByBlockId((prev) => ({ ...prev, [block.id]: { ...(prev[block.id] ?? { title: "", description: "", type: "CHECK", required: true, assignedRole: "SELLER", confirmerRole: "BUYER" }), description: e.target.value } }))} />
                  <button className="px-2 py-1 rounded bg-blue-600 text-white" onClick={() => addCondition(block.id)}>Add Condition</button>
                </div>

                <button className="px-3 py-2 rounded bg-green-600 text-white disabled:opacity-50" disabled={!canFinalApprove} title={canFinalApprove ? "" : "Final approver role + block READY_FOR_FINAL_APPROVAL required"} onClick={() => finalApprove(block.id)}>
                  Final Approve (Manual)
                </button>
              </div>
            );
          })}
        </section>
      )}
    </main>
  );
}
