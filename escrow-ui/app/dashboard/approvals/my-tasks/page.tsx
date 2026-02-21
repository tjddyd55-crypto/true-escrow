"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Item = {
  tradeId: string;
  tradeTitle: string;
  blockTitle: string;
  conditionId: string;
  conditionTitle: string;
  conditionType: "CHECK" | "FILE_UPLOAD" | "TEXT" | "NUMBER" | "DATE";
};

export default function MyTasksPage() {
  const [items, setItems] = useState<Item[]>([]);
  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/dashboard/my-tasks", { cache: "no-store" });
      const json = await res.json().catch(() => ({}));
      setItems(json?.ok ? json.data ?? [] : []);
    })();
  }, []);
  return (
    <div>
      <h1 className="text-xl font-semibold mb-3">My Tasks</h1>
      <div className="space-y-2">
        {items.map((a) => (
          <div key={a.conditionId} className="border rounded p-3">
            <div className="font-medium">{a.conditionTitle}</div>
            <div className="text-sm text-gray-600">{a.tradeTitle} / {a.blockTitle} / {a.conditionType}</div>
            <Link className="text-blue-600 text-sm" href={`/transactions/${a.tradeId}`}>Open trade</Link>
          </div>
        ))}
        {items.length === 0 && <p className="text-sm text-gray-500">No tasks.</p>}
      </div>
    </div>
  );
}
