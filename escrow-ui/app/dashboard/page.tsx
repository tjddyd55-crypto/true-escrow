"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Transaction = {
  id: string;
  title: string;
  status: string;
  createdAt?: string;
};

export default function DashboardPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/engine/transactions", { cache: "no-store" });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.ok && Array.isArray(json.data)) {
        setTransactions(json.data);
      } else {
        setTransactions([]);
      }
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <main className="max-w-4xl mx-auto p-6">Loading...</main>;

  return (
    <main className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <Link className="px-3 py-2 rounded bg-blue-600 text-white" href="/transaction/new">
          Create Transaction
        </Link>
      </div>
      {transactions.length === 0 ? (
        <p className="text-gray-600">생성된 거래가 없습니다.</p>
      ) : (
        <div className="space-y-2">
          {transactions.map((tx) => (
            <div key={tx.id} className="border rounded p-4">
              <div className="font-medium">{tx.title || tx.id}</div>
              <div className="text-sm text-gray-600 mt-1">Status: {tx.status}</div>
              <div className="flex gap-3 mt-2 text-sm">
                <Link className="text-blue-600" href={`/transaction/builder/${tx.id}`}>Builder</Link>
                <Link className="text-teal-600" href={`/transaction/${tx.id}/buyer`}>Buyer</Link>
                <Link className="text-violet-600" href={`/transaction/${tx.id}/seller`}>Seller</Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
