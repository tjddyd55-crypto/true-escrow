"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

type Role = "BUYER" | "SELLER" | "VERIFIER";
type ConditionType = "CHECK" | "FILE_UPLOAD" | "TEXT" | "NUMBER" | "DATE";
type ConditionStatus = "PENDING" | "SUBMITTED" | "CONFIRMED" | "REJECTED";
type BlockStatus = "DRAFT" | "IN_PROGRESS" | "READY_FOR_FINAL_APPROVAL" | "APPROVED" | "DISPUTED" | "ON_HOLD";

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
  }>;
};

type Tab = "overview" | "blocks" | "participants";
const ROLES: Role[] = ["BUYER", "SELLER", "VERIFIER"];
const CONDITION_TYPES: ConditionType[] = ["CHECK", "FILE_UPLOAD", "TEXT", "NUMBER", "DATE"];

export default function TradeDetailPage() {
  const params = useParams();
  const tradeId = (params.tradeId ?? params.id) as string;
  const [tab, setTab] = useState<Tab>("overview");
  const [detail, setDetail] = useState<TradeDetail | null>(null);
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

  useEffect(() => {
    void load();
  }, [tradeId]);

  async function load() {
    const [meRes, detailRes] = await Promise.all([fetch("/api/me"), fetch(`/api/trades/${tradeId}`)]);
    const meJson = await meRes.json().catch(() => ({}));
    const detailJson = await detailRes.json().catch(() => ({}));
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

  async function submitCondition(blockId: string, conditionId: string, isResubmit: boolean) {
    try {
      await callAction(
        `/api/trades/${tradeId}/blocks/${blockId}/conditions/${conditionId}/${isResubmit ? "resubmit" : "submit"}`
      );
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Submit failed");
    }
  }

  async function confirmCondition(blockId: string, conditionId: string) {
    try {
      await callAction(`/api/trades/${tradeId}/blocks/${blockId}/conditions/${conditionId}/confirm`);
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Confirm failed");
    }
  }

  async function rejectCondition(blockId: string, conditionId: string) {
    const rejectReason = prompt("Reject reason");
    if (!rejectReason) return;
    const newDueDate = prompt("New due date (YYYY-MM-DD)");
    if (!newDueDate) return;
    try {
      await callAction(`/api/trades/${tradeId}/blocks/${blockId}/conditions/${conditionId}/reject`, { rejectReason, newDueDate });
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Reject failed");
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

  if (!detail) return <main className="max-w-6xl mx-auto p-6">Loading...</main>;

  return (
    <main className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-2">{detail.trade.title}</h1>
      {detail.trade.description && <p className="text-gray-600 mb-4">{detail.trade.description}</p>}

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
            const conditions = detail.conditions.filter((c) => c.blockId === block.id);
            const canFinalApprove = myRole === block.finalApproverRole && block.status === "READY_FOR_FINAL_APPROVAL";
            return (
              <div key={block.id} className="border rounded p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-1 rounded bg-gray-100">{block.status}</span>
                  <span className="text-sm text-gray-600">Due Date: {block.dueDate}</span>
                  {block.extendedDueDate ? <span className="text-sm text-red-600">Extended: {block.extendedDueDate}</span> : null}
                </div>
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
                        const canSubmit = myRole === c.assignedRole && c.status === "PENDING";
                        const canResubmit = myRole === c.assignedRole && c.status === "REJECTED";
                        const canConfirm = myRole === c.confirmerRole && c.status === "SUBMITTED";
                        const canReject = myRole === c.confirmerRole && c.status === "SUBMITTED";
                        return (
                          <div key={c.id} className="border rounded p-3 text-sm space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <div>
                                <div className="font-medium">{c.title} {c.required ? "(required)" : "(optional)"}</div>
                                <div className="text-gray-500">{c.type} / assigned: {c.assignedRole} / confirmer: {c.confirmerRole}</div>
                              </div>
                              <span className="text-xs px-2 py-1 rounded bg-gray-100">{c.status}</span>
                            </div>
                            {c.rejectReason ? <div className="text-red-600">Reject reason: {c.rejectReason}</div> : null}
                            <div className="flex flex-wrap gap-2">
                              <button className="px-2 py-1 rounded border disabled:opacity-50" disabled={!canSubmit} onClick={() => submitCondition(block.id, c.id, false)}>Submit</button>
                              <button className="px-2 py-1 rounded border disabled:opacity-50" disabled={!canResubmit} onClick={() => submitCondition(block.id, c.id, true)}>Resubmit</button>
                              <button className="px-2 py-1 rounded border disabled:opacity-50" disabled={!canConfirm} onClick={() => confirmCondition(block.id, c.id)}>Confirm</button>
                              <button className="px-2 py-1 rounded border disabled:opacity-50" disabled={!canReject} onClick={() => rejectCondition(block.id, c.id)}>Reject</button>
                            </div>
                          </div>
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
