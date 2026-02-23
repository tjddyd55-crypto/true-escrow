"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

type Me = { id: string; email: string; name?: string | null } | null;

export default function AuthNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [me, setMe] = useState<Me>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/me", { cache: "no-store" });
        const json = await res.json().catch(() => ({}));
        if (res.ok && json.ok) setMe(json.data ?? null);
        else setMe(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [pathname]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setMe(null);
    router.replace("/auth/login");
    router.refresh();
  }

  if (loading) return <span style={{ fontSize: "0.85rem", color: "#888" }}>...</span>;

  if (!me) {
    return (
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <Link href="/auth/login" style={{ color: "#2563eb", textDecoration: "none", fontSize: "0.9rem" }}>
          Login
        </Link>
        <Link href="/auth/signup" style={{ color: "#2563eb", textDecoration: "none", fontSize: "0.9rem" }}>
          Sign up
        </Link>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
      <Link href="/transactions/new" style={{ color: "#2563eb", textDecoration: "none", fontSize: "0.9rem" }}>
        Create Transaction
      </Link>
      <details>
        <summary style={{ cursor: "pointer", fontSize: "0.85rem", color: "#666" }}>{me.email}</summary>
        <div style={{ position: "absolute", right: 12, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, padding: 8, display: "grid", gap: 6, minWidth: 160 }}>
          <a href="#" style={{ fontSize: "0.85rem", color: "#374151", textDecoration: "none" }}>Profile</a>
          <button
            type="button"
            onClick={logout}
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: 6,
              background: "white",
              padding: "6px 10px",
              cursor: "pointer",
              fontSize: "0.85rem",
              textAlign: "left",
            }}
          >
            Logout
          </button>
        </div>
      </details>
    </div>
  );
}
