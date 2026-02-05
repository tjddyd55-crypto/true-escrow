"use client";

import { useEffect, useState } from "react";

interface Transaction {
  id: string;
  title: string;
  buyerId: string;
  status: string;
  milestones?: Milestone[];
}

interface Milestone {
  id: string;
  title: string;
  amount: string;
  status: string;
  orderIndex: number;
}

export default function SellerDashboard() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransactions();
  }, []);

  async function fetchTransactions() {
    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";
      const res = await fetch(`${apiBaseUrl}/api/transactions`, {
        headers: {
          "X-User-Id": "00000000-0000-0000-0000-000000000002", // Demo seller ID
          "X-User-Role": "SELLER",
        },
      });

      if (res.ok) {
        const data = await res.json();
        setTransactions(data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
    } finally {
      setLoading(false);
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case "CREATED": return "#f39c12";
      case "ESCROW_SIMULATED": return "#00b894";
      case "IN_PROGRESS": return "#0984e3";
      case "WAITING_APPROVAL": return "#6c5ce7";
      case "COMPLETED": return "#00b894";
      case "PAUSED": return "#e74c3c";
      default: return "#666";
    }
  }

  if (loading) {
    return <div style={{ padding: 40 }}>Loading...</div>;
  }

  return (
    <main style={{ padding: "40px 20px", maxWidth: 1200, margin: "0 auto" }}>
      <h1 style={{ fontSize: "2.5rem", marginBottom: 30 }}>Seller Dashboard</h1>

      <div style={{ marginBottom: 20, padding: 15, backgroundColor: "#f0f9ff", borderRadius: 8, border: "1px solid #bae6fd" }}>
        <p style={{ margin: 0, fontWeight: "600" }}>
          💰 Funds in escrow (simulated)
        </p>
        <p style={{ margin: "5px 0 0 0", fontSize: "0.9rem", color: "#666" }}>
          All transactions are in simulation mode. No actual payments are processed.
        </p>
      </div>

      {transactions.length === 0 ? (
        <p>No transactions found.</p>
      ) : (
        <div style={{ display: "grid", gap: 20 }}>
          {transactions.map((tx) => (
            <a
              key={tx.id}
              href={`/seller/milestones/${tx.id}`}
              style={{
                display: "block",
                padding: 20,
                border: "1px solid #e0e0e0",
                borderRadius: 8,
                textDecoration: "none",
                color: "inherit",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 15 }}>
                <div>
                  <h3 style={{ margin: 0, marginBottom: 5 }}>{tx.title}</h3>
                  <p style={{ margin: 0, fontSize: "0.9rem", color: "#666" }}>
                    Buyer ID: {tx.buyerId.substring(0, 8)}...
                  </p>
                </div>
                <span
                  style={{
                    padding: "4px 12px",
                    borderRadius: 4,
                    backgroundColor: getStatusColor(tx.status),
                    color: "white",
                    fontSize: "0.85rem",
                    fontWeight: "600",
                  }}
                >
                  {tx.status.replace("_", " ")}
                </span>
              </div>

              {tx.milestones && (
                <div style={{ fontSize: "0.9rem", color: "#666" }}>
                  {tx.milestones.filter(m => m.status === "PENDING").length} pending,{" "}
                  {tx.milestones.filter(m => m.status === "SUBMITTED").length} submitted,{" "}
                  {tx.milestones.filter(m => m.status === "APPROVED").length} approved
                </div>
              )}
            </a>
          ))}
        </div>
      )}
    </main>
  );
}
