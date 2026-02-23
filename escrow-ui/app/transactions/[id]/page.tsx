"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import TradeDetailPage from "@/app/trades/[tradeId]/page";

export default function TransactionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [resolved, setResolved] = useState(false);
  const [isMvpTrade, setIsMvpTrade] = useState(false);

  useEffect(() => {
    void (async () => {
      const res = await fetch(`/api/trades/${id}`, { cache: "no-store" });
      if (res.ok) {
        setIsMvpTrade(true);
        setResolved(true);
        return;
      }
      router.replace(`/transaction/builder/${id}`);
    })();
  }, [id, router]);

  if (!resolved) return <main className="max-w-5xl mx-auto p-6">Loading...</main>;
  if (!isMvpTrade) return null;
  return <TradeDetailPage />;
}
