"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Item = {
  tradeId: string;
  tradeTitle: string;
  blockId: string;
  blockTitle: string;
  finalApproverRole: string;
  ready: boolean;
  missingRequiredCount: number;
};

export default function FinalApprovalWaitingPage() {
  const [items, setItems] = useState<Item[]>([]);
  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/dashboard/final-approval-waiting", { cache: "no-store" });
      const json = await res.json().catch(() => ({}));
      setItems(json?.ok ? json.data ?? [] : []);
    })();
  }, []);
  return (
    <div>
      <h1 className="text-xl font-semibold mb-3">Final Approval Waiting</h1>
      <div className="space-y-2">
        {items.map((a) => (
          <div key={a.blockId} className="border rounded p-3">
            <div className="font-medium">{a.tradeTitle} / {a.blockTitle}</div>
            <div className="text-sm text-gray-600">Role: {a.finalApproverRole} / READY_FOR_FINAL_APPROVAL</div>
            <Link className="text-blue-600 text-sm" href={`/transactions/${a.tradeId}`}>Open trade</Link>
          </div>
        ))}
        {items.length === 0 && <p className="text-sm text-gray-500">No blocks waiting for final approval.</p>}
      </div>
    </div>
  );
}
