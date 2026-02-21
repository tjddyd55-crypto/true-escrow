"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewTradePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/trades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) {
        setError(json.error ?? "거래 생성에 실패했습니다.");
        return;
      }
      router.push(`/trades/${json.data.id}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-6">Create Trade</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <input
          className="w-full border rounded p-2"
          placeholder="거래 제목"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <textarea
          className="w-full border rounded p-2"
          rows={4}
          placeholder="거래 설명"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-60" disabled={saving}>
          {saving ? "저장 중..." : "생성"}
        </button>
      </form>
    </main>
  );
}
