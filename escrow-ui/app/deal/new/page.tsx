"use client";

import { useRouter } from "next/navigation";

export default function NewDealPage() {
  const router = useRouter();

  async function createDeal() {
    const res = await fetch("/api/deals", { method: "POST" });
    const data = await res.json();
    router.push(`/deal/${data.id}`);
  }

  return (
    <main style={{ padding: 40 }}>
      <h2>Create Deal</h2>
      <button onClick={createDeal}>
        🚗 Used Car Transaction
      </button>
    </main>
  );
}
