"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

type Role = "BUYER" | "SELLER" | "VERIFIER";
type BlockStatus = "DRAFT" | "OPEN" | "FINAL_APPROVED";

type TradeDetail = {
  trade: { id: string; title: string; description?: string | null; createdBy: string; createdAt: string };
  participants: Array<{
    id: string;
    userId?: string | null;
    role: Role;
    status: "INVITED" | "ACCEPTED" | "DECLINED";
    inviteType: "EMAIL" | "PHONE";
    inviteTarget: string;
  }>;
  blocks: Array<{
    id: string;
    title: string;
    dueAt: string;
    finalApproverRole: Role;
    status: BlockStatus;
  }>;
  conditions: Array<{
    id: string;
    blockId: string;
    title: string;
    description?: string | null;
    type: "CHECK" | "FILE";
    required: boolean;
    assignedRole: Role;
    status: "PENDING" | "CONFIRMED";
    confirmedBy?: string | null;
  }>;
};

type Tab = "overview" | "blocks" | "participants";

const ROLES: Role[] = ["BUYER", "SELLER", "VERIFIER"];

export default function TradeDetailPage() {
  const params = useParams();
  const tradeId = params.tradeId as string;
  const [tab, setTab] = useState<Tab>("overview");
  const [detail, setDetail] = useState<TradeDetail | null>(null);
  const [me, setMe] = useState<{ id: string } | null>(null);

  const [inviteForm, setInviteForm] = useState({ inviteType: "EMAIL", inviteTarget: "", role: "SELLER" as Role });
  const [blockDraft, setBlockDraft] = useState({ title: "", dueAt: "", finalApproverRole: "BUYER" as Role });
  const [blockEditById, setBlockEditById] = useState<Record<string, { title: string; dueAt: string; finalApproverRole: Role }>>({});
  const [conditionDraftByBlockId, setConditionDraftByBlockId] = useState<
    Record<string, { title: string; description: string; type: "CHECK" | "FILE"; required: boolean; assignedRole: Role }>
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
      const nextEdit: Record<string, { title: string; dueAt: string; finalApproverRole: Role }> = {};
      for (const b of detailJson.data.blocks ?? []) {
        nextEdit[b.id] = { title: b.title, dueAt: b.dueAt, finalApproverRole: b.finalApproverRole };
      }
      setBlockEditById(nextEdit);
    }
  }

  const myRole = useMemo(() => {
    if (!detail || !me) return null;
    return detail.participants.find((p) => p.userId === me.id && p.status === "ACCEPTED")?.role ?? null;
  }, [detail, me]);

  async function createInvite() {
    const res = await fetch(`/api/trades/${tradeId}/invites`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(inviteForm),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.ok) {
      alert(json.error ?? "Invite failed");
      return;
    }
    alert(`Invite URL: ${json.data.inviteUrl}`);
    setInviteForm({ inviteType: "EMAIL", inviteTarget: "", role: "SELLER" });
    await load();
  }

  async function createBlock() {
    const res = await fetch(`/api/trades/${tradeId}/blocks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(blockDraft),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.ok) {
      alert(json.error ?? "Create block failed");
      return;
    }
    setBlockDraft({ title: "", dueAt: "", finalApproverRole: "BUYER" });
    await load();
  }

  async function saveBlock(blockId: string) {
    const draft = blockEditById[blockId];
    const res = await fetch(`/api/trades/${tradeId}/blocks/${blockId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.ok) {
      alert(json.error ?? "Save block failed");
      return;
    }
    await load();
  }

  async function addCondition(blockId: string) {
    const draft = conditionDraftByBlockId[blockId] ?? {
      title: "",
      description: "",
      type: "CHECK" as const,
      required: true,
      assignedRole: "SELLER" as Role,
    };
    const res = await fetch(`/api/trades/${tradeId}/blocks/${blockId}/conditions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.ok) {
      alert(json.error ?? "Add condition failed");
      return;
    }
    setConditionDraftByBlockId((prev) => ({
      ...prev,
      [blockId]: { title: "", description: "", type: "CHECK", required: true, assignedRole: "SELLER" },
    }));
    await load();
  }

  async function confirmCondition(blockId: string, conditionId: string) {
    const res = await fetch(`/api/trades/${tradeId}/blocks/${blockId}/conditions/${conditionId}/confirm`, {
      method: "POST",
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.ok) {
      alert(json.error ?? "Confirm failed");
      return;
    }
    await load();
  }

  async function finalApprove(blockId: string) {
    const res = await fetch(`/api/trades/${tradeId}/blocks/${blockId}/final-approve`, {
      method: "POST",
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.ok) {
      alert(json.error ?? "Final approve failed");
      return;
    }
    await load();
  }

  if (!detail) return <main className="max-w-5xl mx-auto p-6">Loading...</main>;

  return (
    <main className="max-w-5xl mx-auto p-6">
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
          <p className="text-sm text-gray-600">Blocks: {detail.blocks.length}</p>
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
              <input className="border rounded p-2" type="datetime-local" value={blockDraft.dueAt} onChange={(e) => setBlockDraft((p) => ({ ...p, dueAt: e.target.value }))} />
              <select className="border rounded p-2" value={blockDraft.finalApproverRole} onChange={(e) => setBlockDraft((p) => ({ ...p, finalApproverRole: e.target.value as Role }))}>
                {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <button className="px-3 py-2 rounded bg-blue-600 text-white" onClick={createBlock}>Create</button>
          </div>

          {detail.blocks.map((block) => {
            const conditions = detail.conditions.filter((c) => c.blockId === block.id);
            const requiredNotConfirmed = conditions.filter((c) => c.required && c.status !== "CONFIRMED");
            const canFinalApprove = requiredNotConfirmed.length === 0 && myRole === block.finalApproverRole;
            return (
              <div key={block.id} className="border rounded p-4 space-y-3">
                <div className="text-sm text-gray-500">Status: {block.status}</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    className="border rounded p-2"
                    value={blockEditById[block.id]?.title ?? ""}
                    onChange={(e) => setBlockEditById((prev) => ({ ...prev, [block.id]: { ...prev[block.id], title: e.target.value } }))}
                  />
                  <input
                    className="border rounded p-2"
                    type="datetime-local"
                    value={blockEditById[block.id]?.dueAt ?? ""}
                    onChange={(e) => setBlockEditById((prev) => ({ ...prev, [block.id]: { ...prev[block.id], dueAt: e.target.value } }))}
                  />
                  <select
                    className="border rounded p-2"
                    value={blockEditById[block.id]?.finalApproverRole ?? "BUYER"}
                    onChange={(e) => setBlockEditById((prev) => ({ ...prev, [block.id]: { ...prev[block.id], finalApproverRole: e.target.value as Role } }))}
                  >
                    {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <button className="px-3 py-2 rounded bg-gray-800 text-white" onClick={() => saveBlock(block.id)}>Save</button>

                <div className="border rounded p-3 space-y-2">
                  <h3 className="font-medium">Approval Conditions</h3>
                  {conditions.length === 0 ? (
                    <p className="text-sm text-gray-500">No conditions yet</p>
                  ) : (
                    <div className="space-y-2">
                      {conditions.map((c) => {
                        const canConfirm = myRole === c.assignedRole && c.status !== "CONFIRMED";
                        return (
                          <div key={c.id} className="border rounded p-2 text-sm flex justify-between items-center gap-2">
                            <div>
                              <div className="font-medium">{c.title} {c.required ? "(required)" : "(optional)"}</div>
                              <div className="text-gray-500">{c.type} / assigned: {c.assignedRole} / status: {c.status}</div>
                            </div>
                            <button
                              className="px-2 py-1 rounded border disabled:opacity-50"
                              disabled={!canConfirm}
                              onClick={() => confirmCondition(block.id, c.id)}
                            >
                              Confirm
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                    <input
                      className="border rounded p-2 sm:col-span-2"
                      placeholder="condition title"
                      value={conditionDraftByBlockId[block.id]?.title ?? ""}
                      onChange={(e) => setConditionDraftByBlockId((prev) => ({ ...prev, [block.id]: { ...(prev[block.id] ?? { title: "", description: "", type: "CHECK", required: true, assignedRole: "SELLER" }), title: e.target.value } }))}
                    />
                    <select
                      className="border rounded p-2"
                      value={conditionDraftByBlockId[block.id]?.type ?? "CHECK"}
                      onChange={(e) => setConditionDraftByBlockId((prev) => ({ ...prev, [block.id]: { ...(prev[block.id] ?? { title: "", description: "", type: "CHECK", required: true, assignedRole: "SELLER" }), type: e.target.value as "CHECK" | "FILE" } }))}
                    >
                      <option value="CHECK">CHECK</option>
                      <option value="FILE">FILE</option>
                    </select>
                    <select
                      className="border rounded p-2"
                      value={conditionDraftByBlockId[block.id]?.assignedRole ?? "SELLER"}
                      onChange={(e) => setConditionDraftByBlockId((prev) => ({ ...prev, [block.id]: { ...(prev[block.id] ?? { title: "", description: "", type: "CHECK", required: true, assignedRole: "SELLER" }), assignedRole: e.target.value as Role } }))}
                    >
                      {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={conditionDraftByBlockId[block.id]?.required ?? true}
                        onChange={(e) => setConditionDraftByBlockId((prev) => ({ ...prev, [block.id]: { ...(prev[block.id] ?? { title: "", description: "", type: "CHECK", required: true, assignedRole: "SELLER" }), required: e.target.checked } }))}
                      />
                      Required
                    </label>
                  </div>
                  <textarea
                    className="w-full border rounded p-2"
                    rows={2}
                    placeholder="description"
                    value={conditionDraftByBlockId[block.id]?.description ?? ""}
                    onChange={(e) => setConditionDraftByBlockId((prev) => ({ ...prev, [block.id]: { ...(prev[block.id] ?? { title: "", description: "", type: "CHECK", required: true, assignedRole: "SELLER" }), description: e.target.value } }))}
                  />
                  <button className="px-2 py-1 rounded bg-blue-600 text-white" onClick={() => addCondition(block.id)}>Add Condition</button>
                </div>

                <button
                  className="px-3 py-2 rounded bg-green-600 text-white disabled:opacity-50"
                  disabled={!canFinalApprove}
                  title={canFinalApprove ? "" : "Only final approver role can approve and all required conditions must be confirmed"}
                  onClick={() => finalApprove(block.id)}
                >
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
