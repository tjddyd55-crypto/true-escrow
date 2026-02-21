"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewTransactionPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onCreate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/trades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) {
        setError(json.error ?? "Create failed");
        return;
      }
      router.push(`/transactions/${json.data.id}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-xl mx-auto p-6 space-y-3">
      <h1 className="text-2xl font-semibold">Create Transaction</h1>
      <input className="w-full border rounded p-2" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
      <textarea className="w-full border rounded p-2" rows={4} placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <button className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-60" disabled={loading || !title.trim()} onClick={onCreate}>
        {loading ? "Saving..." : "Save"}
      </button>
    </main>
  );
}
