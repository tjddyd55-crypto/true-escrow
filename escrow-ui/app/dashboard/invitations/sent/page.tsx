"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Invite = {
  inviteId: string;
  tradeId: string;
  tradeTitle: string;
  token: string;
  role: string;
  status: string;
  inviteTarget: string;
  createdAt: string;
};

export default function SentInvitesPage() {
  const [items, setItems] = useState<Invite[]>([]);
  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/dashboard/invitations", { cache: "no-store" });
      const json = await res.json().catch(() => ({}));
      setItems(json?.ok ? json.data?.sent ?? [] : []);
    })();
  }, []);
  return (
    <div>
      <h1 className="text-xl font-semibold mb-3">Sent Invites</h1>
      <div className="space-y-2">
        {items.map((inv) => (
          <div key={inv.inviteId} className="border rounded p-3">
            <div className="font-medium">{inv.tradeTitle}</div>
            <div className="text-sm text-gray-600">{inv.role} / {inv.status} / {inv.inviteTarget}</div>
            <Link className="text-blue-600 text-sm" href={`/invites/${inv.token}`}>Open invite</Link>
          </div>
        ))}
        {items.length === 0 && <p className="text-sm text-gray-500">No sent invites.</p>}
      </div>
    </div>
  );
}
