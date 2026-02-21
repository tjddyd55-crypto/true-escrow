"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Trade = {
  id: string;
  title: string;
  description?: string | null;
  createdAt: string;
};

export default function DashboardPage() {
  const [me, setMe] = useState<{ id: string; email: string } | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const [meRes, tradeRes] = await Promise.all([fetch("/api/me"), fetch("/api/trades")]);
      const meJson = await meRes.json().catch(() => ({}));
      if (!meJson.ok || !meJson.data) {
        setMe(null);
        setTrades([]);
        return;
      }
      setMe(meJson.data);
      const tradeJson = await tradeRes.json().catch(() => ({}));
      if (tradeRes.ok && tradeJson.ok) setTrades(tradeJson.data ?? []);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <main className="max-w-4xl mx-auto p-6">Loading...</main>;

  if (!me) {
    return (
      <main className="max-w-4xl mx-auto p-6 space-y-4">
        <h1 className="text-2xl font-semibold">My Trades</h1>
        <p className="text-gray-600">로그인이 필요합니다.</p>
        <div className="flex gap-3">
          <Link className="px-4 py-2 rounded bg-blue-600 text-white" href="/auth/login">로그인</Link>
          <Link className="px-4 py-2 rounded border" href="/auth/signup">회원가입</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold">My Trades</h1>
        <Link className="px-3 py-2 rounded bg-blue-600 text-white" href="/trades/new">
          New Trade
        </Link>
      </div>
      <p className="text-sm text-gray-500 mb-4">{me.email}</p>
      {trades.length === 0 ? (
        <p className="text-gray-600">생성/참여한 거래가 없습니다.</p>
      ) : (
        <div className="space-y-2">
          {trades.map((trade) => (
            <Link
              key={trade.id}
              href={`/trades/${trade.id}`}
              className="block border rounded p-4 hover:bg-gray-50"
            >
              <div className="font-medium">{trade.title}</div>
              {trade.description && <div className="text-sm text-gray-600">{trade.description}</div>}
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
