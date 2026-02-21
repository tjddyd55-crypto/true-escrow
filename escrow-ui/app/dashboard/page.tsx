"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Trade = {
  id: string;
  title: string;
  description?: string | null;
  createdBy: string;
  createdAt: string;
};

export default function DashboardPage() {
  const [me, setMe] = useState<{ id: string; email: string } | null>(null);
  const [createdTrades, setCreatedTrades] = useState<Trade[]>([]);
  const [participantTrades, setParticipantTrades] = useState<Trade[]>([]);
  const [pendingActions, setPendingActions] = useState<
    Array<{
      tradeId: string;
      tradeTitle: string;
      blockId: string;
      blockTitle: string;
      conditionId: string;
      conditionTitle: string;
      assignedRole: "BUYER" | "SELLER" | "VERIFIER";
      conditionType: "CHECK" | "FILE";
    }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [finalWaiting, setFinalWaiting] = useState<Array<{ tradeId: string; blockId: string; ready: boolean }>>([]);
  const [receivedInvitesCount, setReceivedInvitesCount] = useState(0);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const [meRes, summaryRes, finalRes, inviteRes] = await Promise.all([
        fetch("/api/me", { cache: "no-store" }),
        fetch("/api/dashboard/summary", { cache: "no-store" }),
        fetch("/api/dashboard/final-approval-waiting", { cache: "no-store" }),
        fetch("/api/dashboard/invitations", { cache: "no-store" }),
      ]);
      const meJson = await meRes.json().catch(() => ({}));
      setMe(meJson.ok ? meJson.data : null);
      const summaryJson = await summaryRes.json().catch(() => ({}));
      if (summaryRes.ok && summaryJson.ok && summaryJson.data) {
        setCreatedTrades(summaryJson.data.createdTrades ?? []);
        setParticipantTrades(summaryJson.data.participantTrades ?? []);
        setPendingActions(summaryJson.data.pendingActions ?? []);
      } else {
        setCreatedTrades([]);
        setParticipantTrades([]);
        setPendingActions([]);
      }
      const finalJson = await finalRes.json().catch(() => ({}));
      setFinalWaiting(finalJson?.ok ? finalJson.data ?? [] : []);
      const inviteJson = await inviteRes.json().catch(() => ({}));
      setReceivedInvitesCount(inviteJson?.ok ? Number(inviteJson.data?.received?.length ?? 0) : 0);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <main className="max-w-4xl mx-auto p-6">Loading...</main>;

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Overview</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-5">
        <div className="border rounded-lg p-3">
          <div className="text-xs text-gray-500">Created by Me</div>
          <div className="text-xl font-semibold">{createdTrades.length}</div>
        </div>
        <div className="border rounded-lg p-3">
          <div className="text-xs text-gray-500">Participating</div>
          <div className="text-xl font-semibold">{participantTrades.length}</div>
        </div>
        <div className="border rounded-lg p-3">
          <div className="text-xs text-gray-500">Pending Approvals</div>
          <div className="text-xl font-semibold">{pendingActions.length}</div>
        </div>
        <div className="border rounded-lg p-3">
          <div className="text-xs text-gray-500">Received Invites</div>
          <div className="text-xl font-semibold">{receivedInvitesCount}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <section className="border rounded-lg p-4 bg-white">
          <h2 className="font-semibold mb-3">Trades Created By Me</h2>
          {createdTrades.length === 0 ? (
            <p className="text-sm text-gray-600">No created trades.</p>
          ) : (
            <div className="space-y-2">
              {createdTrades.map((trade) => (
                <div key={trade.id} className="border rounded p-3">
                  <div className="font-medium">{trade.title}</div>
                  <div className="text-xs text-gray-500">{new Date(trade.createdAt).toLocaleString()}</div>
                  <Link className="text-blue-600 text-sm" href={`/transactions/${trade.id}`}>Open</Link>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="border rounded-lg p-4 bg-white">
          <h2 className="font-semibold mb-3">Trades Where I Am Participant</h2>
          {participantTrades.length === 0 ? (
            <p className="text-sm text-gray-600">No participant trades.</p>
          ) : (
            <div className="space-y-2">
              {participantTrades.map((trade) => (
                <div key={trade.id} className="border rounded p-3">
                  <div className="font-medium">{trade.title}</div>
                  <div className="text-xs text-gray-500">{new Date(trade.createdAt).toLocaleString()}</div>
                  <Link className="text-blue-600 text-sm" href={`/transactions/${trade.id}`}>Open</Link>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <section className="border rounded-lg p-4 bg-white mt-4">
        <h2 className="font-semibold mb-3">Recent Activity</h2>
        <div className="space-y-2 text-sm">
          {pendingActions.slice(0, 3).map((a) => (
            <div key={a.conditionId} className="border rounded p-2 bg-gray-50">
              Pending condition: <b>{a.conditionTitle}</b> in <b>{a.tradeTitle}</b>
              <div>
                <Link className="text-blue-600" href={`/transactions/${a.tradeId}`}>Open</Link>
              </div>
            </div>
          ))}
          {finalWaiting.slice(0, 3).map((f) => (
            <div key={`${f.tradeId}:${f.blockId}`} className="border rounded p-2 bg-gray-50">
              Final approval {f.ready ? "ready" : "waiting"} for block <b>{f.blockId}</b>
              <div>
                <Link className="text-blue-600" href={`/transactions/${f.tradeId}`}>Open</Link>
              </div>
            </div>
          ))}
          {pendingActions.length === 0 && finalWaiting.length === 0 && (
            <p className="text-gray-500">No recent activity.</p>
          )}
        </div>
      </section>

      {me && <div className="mt-4 text-xs text-gray-500">Logged in as {me.email}</div>}
    </div>
  );
}
