"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface TransactionDetail {
  id: string;
  title: string;
  buyerId: string;
  sellerId: string;
  status: string;
  milestones: Milestone[];
  activityLogs: ActivityLog[];
}

interface Milestone {
  id: string;
  title: string;
  amount: string;
  status: string;
  orderIndex: number;
  files: File[];
}

interface File {
  id: string;
  fileName: string;
  fileUrl: string;
  uploaderRole: string;
  createdAt: string;
}

interface ActivityLog {
  id: string;
  actorRole: string;
  action: string;
  meta: any;
  createdAt: string;
}

export default function AdminTransactionDetail() {
  const params = useParams();
  const id = params.id as string;
  const [transaction, setTransaction] = useState<TransactionDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchTransaction();
    }
  }, [id]);

  async function fetchTransaction() {
    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";
      const res = await fetch(`${apiBaseUrl}/api/transactions/${id}`, {
        headers: {
          "X-User-Role": "ADMIN",
        },
      });

      if (res.ok) {
        const data = await res.json();
        setTransaction(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch transaction:", error);
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(newStatus: string) {
    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";
      const res = await fetch(`${apiBaseUrl}/api/transactions/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-User-Role": "ADMIN",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        alert("Status updated!");
        fetchTransaction();
      } else {
        alert("Failed to update status");
      }
    } catch (error) {
      console.error("Failed to update status:", error);
      alert("Error updating status");
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case "PENDING": return "#f39c12";
      case "SUBMITTED": return "#6c5ce7";
      case "APPROVED": return "#00b894";
      default: return "#666";
    }
  }

  if (loading) {
    return <div style={{ padding: 40 }}>Loading...</div>;
  }

  if (!transaction) {
    return <div style={{ padding: 40 }}>Transaction not found</div>;
  }

  return (
    <main style={{ padding: "40px 20px", maxWidth: 1000, margin: "0 auto" }}>
      <a href="/admin/transactions" style={{ color: "#0070f3", textDecoration: "none", marginBottom: 20, display: "inline-block" }}>
        ← Back to Transactions
      </a>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 30 }}>
        <div>
          <h1 style={{ fontSize: "2.5rem", marginBottom: 10 }}>{transaction.title}</h1>
          <p style={{ color: "#666", marginBottom: 5 }}>
            Transaction ID: {transaction.id}
          </p>
          <p style={{ color: "#666", marginBottom: 5 }}>
            Buyer: {transaction.buyerId} | Seller: {transaction.sellerId}
          </p>
        </div>
        <div>
          <select
            value={transaction.status}
            onChange={(e) => updateStatus(e.target.value)}
            style={{
              padding: "8px 12px",
              border: "1px solid #e0e0e0",
              borderRadius: 4,
              fontSize: "0.9rem",
            }}
          >
            <option value="CREATED">CREATED</option>
            <option value="ESCROW_SIMULATED">ESCROW_SIMULATED</option>
            <option value="IN_PROGRESS">IN_PROGRESS</option>
            <option value="WAITING_APPROVAL">WAITING_APPROVAL</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="PAUSED">PAUSED</option>
          </select>
        </div>
      </div>

      <div style={{ marginBottom: 30, padding: 15, backgroundColor: "#fff5f5", borderRadius: 8, border: "1px solid #ffe0e0" }}>
        <p style={{ margin: 0, fontWeight: "600" }}>
          💰 Funds in escrow (simulated)
        </p>
        <p style={{ margin: "5px 0 0 0", fontSize: "0.9rem", color: "#666" }}>
          Admin View - All transactions are in simulation mode
        </p>
      </div>

      {/* Milestones */}
      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: "1.8rem", marginBottom: 20 }}>Milestones</h2>
        <div style={{ display: "grid", gap: 15 }}>
          {transaction.milestones.map((milestone) => (
            <div
              key={milestone.id}
              style={{
                padding: 20,
                border: "1px solid #e0e0e0",
                borderRadius: 8,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 15 }}>
                <div>
                  <h3 style={{ margin: 0, marginBottom: 5 }}>
                    Milestone {milestone.orderIndex}: {milestone.title}
                  </h3>
                  <p style={{ margin: 0, fontSize: "0.9rem", color: "#666" }}>
                    Amount: ${milestone.amount} (simulated)
                  </p>
                </div>
                <span
                  style={{
                    padding: "4px 12px",
                    borderRadius: 4,
                    backgroundColor: getStatusColor(milestone.status),
                    color: "white",
                    fontSize: "0.85rem",
                    fontWeight: "600",
                  }}
                >
                  {milestone.status}
                </span>
              </div>

              {milestone.files && milestone.files.length > 0 && (
                <div style={{ marginBottom: 15 }}>
                  <p style={{ fontSize: "0.9rem", fontWeight: "600", marginBottom: 8 }}>Files:</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    {milestone.files.map((file) => (
                      <a
                        key={file.id}
                        href={file.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ fontSize: "0.9rem", color: "#0070f3" }}
                      >
                        📄 {file.fileName} (uploaded by {file.uploaderRole} on {new Date(file.createdAt).toLocaleDateString()})
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Activity Timeline */}
      <section>
        <h2 style={{ fontSize: "1.8rem", marginBottom: 20 }}>Activity Timeline</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {transaction.activityLogs.map((log) => (
            <div
              key={log.id}
              style={{
                padding: 15,
                borderLeft: "3px solid #0070f3",
                backgroundColor: "#f8f9fa",
                borderRadius: 4,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <span style={{ fontWeight: "600" }}>{log.action.replace("_", " ")}</span>
                <span style={{ fontSize: "0.85rem", color: "#666" }}>
                  {new Date(log.createdAt).toLocaleString()}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: "0.9rem", color: "#666" }}>
                By: <strong>{log.actorRole}</strong>
                {log.meta && Object.keys(log.meta).length > 0 && (
                  <span style={{ marginLeft: 10, fontSize: "0.85rem" }}>
                    ({JSON.stringify(log.meta)})
                  </span>
                )}
              </p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
