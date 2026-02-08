"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Transaction = {
  id: string;
  title: string;
  status: string;
  startDate?: string;
  endDate?: string;
};

export default function TransactionsPage() {
  const [list, setList] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/engine/transactions")
      .then((res) => res.json())
      .then((data) => {
        if (data.ok && Array.isArray(data.data)) setList(data.data);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <main style={{ padding: "24px 20px", maxWidth: 800, margin: "0 auto" }}>
      <h1 style={{ fontSize: "1.75rem", marginBottom: 8 }}>Transactions</h1>
      <p style={{ color: "#666", marginBottom: 24, fontSize: "0.95rem" }}>
        List of transactions (Builder engine). Open one to edit or view.
      </p>
      {loading ? (
        <p style={{ color: "#666" }}>Loading…</p>
      ) : list.length === 0 ? (
        <p style={{ color: "#666" }}>
          No transactions yet.{" "}
          <Link href="/transaction/new" style={{ color: "#0070f3" }}>
            Create Transaction
          </Link>
        </p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {list.map((tx) => (
            <li
              key={tx.id}
              style={{
                padding: "12px 16px",
                border: "1px solid #e0e0e0",
                borderRadius: 8,
                marginBottom: 8,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <span style={{ fontWeight: 600 }}>{tx.title || tx.id}</span>
                <span
                  style={{
                    marginLeft: 10,
                    padding: "2px 8px",
                    borderRadius: 4,
                    fontSize: "0.8rem",
                    backgroundColor:
                      tx.status === "DRAFT"
                        ? "#f39c12"
                        : tx.status === "ACTIVE"
                          ? "#00b894"
                          : "#e0e0e0",
                    color: "white",
                  }}
                >
                  {tx.status}
                </span>
              </div>
              <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                <Link href={`/transaction/builder/${tx.id}`} style={{ color: "#0070f3", textDecoration: "none", fontSize: "0.9rem" }}>
                  Builder
                </Link>
                <Link href={`/transaction/${tx.id}/buyer`} style={{ color: "#0d9488", textDecoration: "none", fontSize: "0.9rem" }}>
                  Buyer
                </Link>
                <Link href={`/transaction/${tx.id}/seller`} style={{ color: "#7c3aed", textDecoration: "none", fontSize: "0.9rem" }}>
                  Seller
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
