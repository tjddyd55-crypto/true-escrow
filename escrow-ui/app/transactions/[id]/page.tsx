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
      const res = await fetch(`/api/transactions/${id}`, { cache: "no-store" });
      const json = await res.json().catch(() => ({}));
      if (res.ok) {
        setIsMvpTrade(json?.data?.kind === "MVP");
        setResolved(true);
        if (json?.data?.kind !== "MVP") {
          router.replace(`/transaction/builder/${id}`);
        }
        return;
      }
      router.replace(`/transaction/builder/${id}`);
    })();
  }, [id, router]);

  if (!resolved) return <main className="max-w-5xl mx-auto p-6">Loading...</main>;
  if (!isMvpTrade) return null;
  return <TradeDetailPage />;
}
