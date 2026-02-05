"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface TransactionDetail {
  id: string;
  title: string;
  status: string;
  milestones: Milestone[];
}

interface Milestone {
  id: string;
  title: string;
  amount: string;
  status: string;
  orderIndex: number;
  files: MilestoneFile[];
}

interface MilestoneFile {
  id: string;
  fileName: string;
  fileUrl: string;
  uploaderRole: string;
}

type UploadFile = {
  name: string;
  size: number;
  type: string;
};

export default function SellerMilestonePage() {
  const params = useParams();
  const transactionId = params.id as string;
  const [transaction, setTransaction] = useState<TransactionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);

  useEffect(() => {
    if (transactionId) {
      fetchTransaction();
    }
  }, [transactionId]);

  async function fetchTransaction() {
    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";
      const res = await fetch(`${apiBaseUrl}/api/transactions/${transactionId}`, {
        headers: {
          "X-User-Id": "00000000-0000-0000-0000-000000000002",
          "X-User-Role": "SELLER",
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

  async function handleFileUpload(milestoneId: string, file: UploadFile) {
    setUploading(milestoneId);
    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";
      
      // Simulated upload - send JSON instead of FormData
      const uploadData = {
        milestoneId: milestoneId,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        uploaderRole: "SELLER",
        simulated: true,
      };

      const res = await fetch(`${apiBaseUrl}/api/files/upload`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-Role": "SELLER",
        },
        body: JSON.stringify(uploadData),
      });

      if (res.ok) {
        alert("File uploaded successfully!");
        fetchTransaction();
      } else {
        alert("Failed to upload file");
      }
    } catch (error) {
      console.error("Failed to upload file:", error);
      alert("Error uploading file");
    } finally {
      setUploading(null);
    }
  }

  async function submitMilestone(milestoneId: string) {
    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";
      const res = await fetch(`${apiBaseUrl}/api/milestones/${milestoneId}/submit`, {
        method: "POST",
        headers: {
          "X-User-Role": "SELLER",
        },
      });

      if (res.ok) {
        alert("Milestone submitted for approval!");
        fetchTransaction();
      } else {
        alert("Failed to submit milestone");
      }
    } catch (error) {
      console.error("Failed to submit milestone:", error);
      alert("Error submitting milestone");
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
      <a href="/seller/dashboard" style={{ color: "#0070f3", textDecoration: "none", marginBottom: 20, display: "inline-block" }}>
        ← Back to Dashboard
      </a>

      <h1 style={{ fontSize: "2.5rem", marginBottom: 10 }}>{transaction.title}</h1>
      <p style={{ color: "#666", marginBottom: 30 }}>
        Transaction ID: {transaction.id}
      </p>

      <div style={{ marginBottom: 30, padding: 15, backgroundColor: "#f0f9ff", borderRadius: 8, border: "1px solid #bae6fd" }}>
        <p style={{ margin: 0, fontWeight: "600" }}>
          💰 Funds in escrow (simulated)
        </p>
        <p style={{ margin: "5px 0 0 0", fontSize: "0.9rem", color: "#666" }}>
          Status: {transaction.status.replace("_", " ")}
        </p>
      </div>

      {/* Milestones */}
      <section>
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

              {/* File Upload */}
              {milestone.status === "PENDING" && (
                <div style={{ marginBottom: 15 }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: 8,
                      fontSize: "0.9rem",
                      fontWeight: "600",
                    }}
                  >
                    Upload File:
                  </label>
                  <input
                    type="file"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleFileUpload(milestone.id, file);
                      }
                    }}
                    disabled={uploading === milestone.id}
                    style={{
                      padding: 8,
                      border: "1px solid #e0e0e0",
                      borderRadius: 4,
                      width: "100%",
                    }}
                  />
                  {uploading === milestone.id && <p style={{ margin: "5px 0 0 0", fontSize: "0.85rem", color: "#666" }}>Uploading...</p>}
                </div>
              )}

              {/* Files List */}
              {milestone.files && milestone.files.length > 0 && (
                <div style={{ marginBottom: 15 }}>
                  <p style={{ fontSize: "0.9rem", fontWeight: "600", marginBottom: 8 }}>Uploaded Files:</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    {milestone.files.map((file) => (
                      <a
                        key={file.id}
                        href={file.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ fontSize: "0.9rem", color: "#0070f3" }}
                      >
                        📄 {file.fileName} (uploaded by {file.uploaderRole})
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Submit Button */}
              {milestone.status === "PENDING" && (
                <button
                  onClick={() => submitMilestone(milestone.id)}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: "#6c5ce7",
                    color: "white",
                    border: "none",
                    borderRadius: 4,
                    cursor: "pointer",
                    fontWeight: "600",
                  }}
                >
                  Submit Milestone for Approval
                </button>
              )}

              {milestone.status === "SUBMITTED" && (
                <p style={{ margin: 0, fontSize: "0.9rem", color: "#6c5ce7", fontWeight: "600" }}>
                  ⏳ Waiting for buyer approval...
                </p>
              )}

              {milestone.status === "APPROVED" && (
                <p style={{ margin: 0, fontSize: "0.9rem", color: "#00b894", fontWeight: "600" }}>
                  ✅ Milestone approved!
                </p>
              )}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
