"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Trade = { id: string; title: string; createdAt: string; status: "DRAFT" | "ACTIVE" | "COMPLETED" };

export default function CreatedTradesPage() {
  const [items, setItems] = useState<Trade[]>([]);
  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/dashboard/transactions?status=DRAFT", { cache: "no-store" });
      const json = await res.json().catch(() => ({}));
      setItems(json?.ok ? json.data ?? [] : []);
    })();
  }, []);
  return (
    <div>
      <h1 className="text-xl font-semibold mb-3">Draft Transactions</h1>
      <div className="space-y-2">
        {items.map((t) => (
          <div key={t.id} className="border rounded p-3">
            <div className="font-medium">{t.title}</div>
            <div className="text-xs text-amber-700 font-medium mt-1">{t.status}</div>
            <div className="text-xs text-gray-500">{new Date(t.createdAt).toLocaleString()}</div>
            <Link className="text-blue-600 text-sm" href={`/transactions/${t.id}`}>Open</Link>
          </div>
        ))}
        {items.length === 0 && <p className="text-sm text-gray-500">No draft transactions.</p>}
      </div>
    </div>
  );
}
