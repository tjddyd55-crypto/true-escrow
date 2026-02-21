"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Trade = { id: string; title: string; createdAt: string };

export default function AllTradesPage() {
  const [created, setCreated] = useState<Trade[]>([]);
  const [participant, setParticipant] = useState<Trade[]>([]);
  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/dashboard/summary", { cache: "no-store" });
      const json = await res.json().catch(() => ({}));
      if (json?.ok) {
        setCreated(json.data?.createdTrades ?? []);
        setParticipant(json.data?.participantTrades ?? []);
      }
    })();
  }, []);
  const all = useMemo(() => {
    const map = new Map<string, Trade>();
    [...created, ...participant].forEach((t) => map.set(t.id, t));
    return Array.from(map.values());
  }, [created, participant]);
  return (
    <div>
      <h1 className="text-xl font-semibold mb-3">All Trades</h1>
      <div className="space-y-2">
        {all.map((t) => (
          <div key={t.id} className="border rounded p-3">
            <div className="font-medium">{t.title}</div>
            <div className="text-xs text-gray-500">{new Date(t.createdAt).toLocaleString()}</div>
            <Link className="text-blue-600 text-sm" href={`/transactions/${t.id}`}>Open</Link>
          </div>
        ))}
        {all.length === 0 && <p className="text-sm text-gray-500">No trades.</p>}
      </div>
    </div>
  );
}
