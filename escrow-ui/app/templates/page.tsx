"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type MyTemplate = {
  id: string;
  title: string;
  description: string | null;
  created_at: string;
};

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<MyTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTemplates();
  }, []);

  async function fetchTemplates() {
    try {
      const res = await fetch("/api/templates");
      if (!res.ok) return;
      const json = await res.json();
      setTemplates(json.data ?? []);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div style={{ padding: 40 }}>Loading…</div>;

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: "40px 20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16, alignItems: "center" }}>
        <h1 style={{ margin: 0 }}>내 템플릿</h1>
        <Link href="/transactions/new" style={{ color: "#0070f3", textDecoration: "none" }}>
          + 새 거래 생성
        </Link>
      </div>
      {templates.length === 0 ? (
        <p style={{ color: "#666" }}>아직 저장된 템플릿이 없습니다. 거래 빌더에서 템플릿으로 저장해보세요.</p>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {templates.map((t) => (
            <article key={t.id} style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 14 }}>
              <div style={{ fontWeight: "700" }}>{t.title}</div>
              {t.description && <div style={{ color: "#666", marginTop: 6 }}>{t.description}</div>}
              <div style={{ color: "#999", fontSize: "0.8rem", marginTop: 10 }}>
                생성일: {new Date(t.created_at).toLocaleString()}
              </div>
              <div style={{ marginTop: 10 }}>
                <Link href={`/transactions/new`} style={{ color: "#0ea5e9", textDecoration: "none", fontWeight: 600 }}>
                  이 템플릿으로 새 거래 만들기
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
