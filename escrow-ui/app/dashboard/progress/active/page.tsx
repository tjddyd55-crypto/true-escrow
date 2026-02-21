"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Trade = { id: string; title: string; createdAt: string };

export default function ActiveProgressPage() {
  const [items, setItems] = useState<Trade[]>([]);
  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/dashboard/progress", { cache: "no-store" });
      const json = await res.json().catch(() => ({}));
      setItems(json?.ok ? json.data?.active ?? [] : []);
    })();
  }, []);
  return (
    <div>
      <h1 className="text-xl font-semibold mb-3">Active</h1>
      <div className="space-y-2">
        {items.map((t) => (
          <div key={t.id} className="border rounded p-3">
            <div className="font-medium">{t.title}</div>
            <Link className="text-blue-600 text-sm" href={`/transactions/${t.id}`}>Open</Link>
          </div>
        ))}
        {items.length === 0 && <p className="text-sm text-gray-500">No active trades.</p>}
      </div>
    </div>
  );
}
