"use client";

import { useEffect, useState } from "react";

interface Transaction {
  id: string;
  title: string;
  buyerId: string;
  sellerId: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export default function AdminTransactionsPage() {
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
          "X-User-Role": "ADMIN",
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
      <h1 style={{ fontSize: "2.5rem", marginBottom: 30 }}>Admin - All Transactions</h1>

      <div style={{ marginBottom: 20, padding: 15, backgroundColor: "#fff5f5", borderRadius: 8, border: "1px solid #ffe0e0" }}>
        <p style={{ margin: 0, fontWeight: "600" }}>
          ⚠️ Admin View - All transactions are in simulation mode
        </p>
      </div>

      {transactions.length === 0 ? (
        <p>No transactions found.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: "#f8f9fa", borderBottom: "2px solid #e0e0e0" }}>
                <th style={{ padding: "12px", textAlign: "left" }}>Title</th>
                <th style={{ padding: "12px", textAlign: "left" }}>Buyer</th>
                <th style={{ padding: "12px", textAlign: "left" }}>Seller</th>
                <th style={{ padding: "12px", textAlign: "left" }}>Status</th>
                <th style={{ padding: "12px", textAlign: "left" }}>Created</th>
                <th style={{ padding: "12px", textAlign: "left" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id} style={{ borderBottom: "1px solid #e0e0e0" }}>
                  <td style={{ padding: "12px" }}>
                    <a
                      href={`/admin/transactions/${tx.id}`}
                      style={{ color: "#0070f3", textDecoration: "none", fontWeight: "600" }}
                    >
                      {tx.title}
                    </a>
                  </td>
                  <td style={{ padding: "12px", fontSize: "0.9rem", color: "#666" }}>
                    {tx.buyerId.substring(0, 8)}...
                  </td>
                  <td style={{ padding: "12px", fontSize: "0.9rem", color: "#666" }}>
                    {tx.sellerId.substring(0, 8)}...
                  </td>
                  <td style={{ padding: "12px" }}>
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
                  </td>
                  <td style={{ padding: "12px", fontSize: "0.9rem", color: "#666" }}>
                    {new Date(tx.createdAt).toLocaleDateString()}
                  </td>
                  <td style={{ padding: "12px" }}>
                    <a
                      href={`/admin/transactions/${tx.id}`}
                      style={{
                        padding: "4px 12px",
                        backgroundColor: "#0070f3",
                        color: "white",
                        textDecoration: "none",
                        borderRadius: 4,
                        fontSize: "0.85rem",
                      }}
                    >
                      View
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
