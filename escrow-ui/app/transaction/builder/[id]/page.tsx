"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

interface Transaction {
  id: string;
  title: string;
  description: string;
  status: string;
}

interface Block {
  id: string;
  title: string;
  startDay: number;
  endDay: number;
  orderIndex: number;
  isActive: boolean;
}

export default function TransactionBuilderPage() {
  const params = useParams();
  const router = useRouter();
  const transactionId = params.id as string;
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (transactionId) {
      fetchTransaction();
      fetchBlocks();
    }
  }, [transactionId]);

  async function fetchTransaction() {
    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";
      const res = await fetch(`${apiBaseUrl}/api/transactions/${transactionId}`);
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

  async function fetchBlocks() {
    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";
      const res = await fetch(`${apiBaseUrl}/api/transaction-builder/transactions/${transactionId}/blocks`);
      if (res.ok) {
        const data = await res.json();
        setBlocks(data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch blocks:", error);
    }
  }

  async function handleAddBlock() {
    const orderIndex = blocks.length + 1;
    const startDay = blocks.length > 0 ? blocks[blocks.length - 1].endDay + 1 : 1;
    const endDay = startDay + 6; // Default 7 days

    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";
      const res = await fetch(`${apiBaseUrl}/api/transaction-builder/transactions/${transactionId}/blocks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: `Block ${orderIndex}`,
          startDay,
          endDay,
          orderIndex,
          approvalType: "SINGLE",
          threshold: null,
        }),
      });

      if (res.ok) {
        fetchBlocks();
      } else {
        alert("Failed to add block");
      }
    } catch (error) {
      console.error("Failed to add block:", error);
      alert("Error adding block");
    }
  }

  async function handleActivate() {
    if (!confirm("Activate this transaction? Block structure will be locked.")) {
      return;
    }

    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";
      const res = await fetch(`${apiBaseUrl}/api/transaction-builder/transactions/${transactionId}/activate`, {
        method: "POST",
      });

      if (res.ok) {
        alert("Transaction activated!");
        fetchTransaction();
        fetchBlocks();
      } else {
        alert("Failed to activate transaction");
      }
    } catch (error) {
      console.error("Failed to activate transaction:", error);
      alert("Error activating transaction");
    }
  }

  if (loading) {
    return <div style={{ padding: 40 }}>Loading...</div>;
  }

  if (!transaction) {
    return <div style={{ padding: 40 }}>Transaction not found</div>;
  }

  const isDraft = transaction.status === "DRAFT";
  const overallDuration = blocks.length > 0 
    ? `Day 1 – Day ${blocks[blocks.length - 1].endDay}`
    : "Not set";

  return (
    <main style={{ padding: "40px 20px", maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ marginBottom: 30 }}>
        <h1 style={{ fontSize: "2.5rem", marginBottom: 10 }}>{transaction.title}</h1>
        <p style={{ color: "#666", marginBottom: 10 }}>{transaction.description}</p>
        <p style={{ color: "#666", marginBottom: 20 }}>
          Overall Duration: {overallDuration}
        </p>
        <div style={{ display: "flex", gap: 10 }}>
          <span
            style={{
              padding: "4px 12px",
              borderRadius: 4,
              backgroundColor: transaction.status === "DRAFT" ? "#f39c12" : "#00b894",
              color: "white",
              fontSize: "0.85rem",
              fontWeight: "600",
            }}
          >
            {transaction.status}
          </span>
          {isDraft && (
            <button
              onClick={handleActivate}
              style={{
                padding: "8px 16px",
                backgroundColor: "#00b894",
                color: "white",
                border: "none",
                borderRadius: 4,
                cursor: "pointer",
                fontWeight: "600",
              }}
            >
              Activate Transaction
            </button>
          )}
        </div>
      </div>

      {/* Blocks */}
      <section style={{ marginBottom: 40 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ fontSize: "1.8rem" }}>Blocks</h2>
          {isDraft && (
            <button
              onClick={handleAddBlock}
              style={{
                padding: "8px 16px",
                backgroundColor: "#0070f3",
                color: "white",
                border: "none",
                borderRadius: 4,
                cursor: "pointer",
                fontWeight: "600",
              }}
            >
              + Add Block
            </button>
          )}
        </div>

        <div style={{ display: "grid", gap: 20 }}>
          {blocks.map((block) => (
            <div
              key={block.id}
              style={{
                padding: 20,
                border: "1px solid #e0e0e0",
                borderRadius: 8,
                backgroundColor: block.isActive ? "#f0f9ff" : "white",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 15 }}>
                <div>
                  <h3 style={{ margin: 0, marginBottom: 5 }}>{block.title}</h3>
                  <p style={{ margin: 0, fontSize: "0.9rem", color: "#666" }}>
                    Period: Day {block.startDay} – Day {block.endDay}
                  </p>
                </div>
                <span
                  style={{
                    padding: "4px 12px",
                    borderRadius: 4,
                    backgroundColor: block.isActive ? "#00b894" : "#f39c12",
                    color: "white",
                    fontSize: "0.85rem",
                    fontWeight: "600",
                  }}
                >
                  {block.isActive ? "Active" : "Locked"}
                </span>
              </div>

              {isDraft && (
                <div style={{ fontSize: "0.9rem", color: "#666" }}>
                  [Block Editor UI - Work Rules, Approval Policy, Approvers]
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Timeline Preview */}
      <section>
        <h2 style={{ fontSize: "1.8rem", marginBottom: 20 }}>Timeline Preview</h2>
        <div style={{ border: "1px solid #e0e0e0", borderRadius: 8, padding: 20 }}>
          {blocks.length === 0 ? (
            <p style={{ color: "#666", textAlign: "center" }}>No blocks yet</p>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              {blocks.map((block) => (
                <div
                  key={block.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: 12,
                    backgroundColor: block.isActive ? "#f0f9ff" : "#f8f9fa",
                    borderRadius: 4,
                  }}
                >
                  <span>
                    Day {block.startDay}–{block.endDay}
                  </span>
                  <span style={{ fontWeight: "600" }}>{block.title}</span>
                  <span
                    style={{
                      padding: "2px 8px",
                      borderRadius: 4,
                      backgroundColor: block.isActive ? "#00b894" : "#e0e0e0",
                      color: block.isActive ? "white" : "#666",
                      fontSize: "0.85rem",
                    }}
                  >
                    {block.isActive ? "Active" : "Locked"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
