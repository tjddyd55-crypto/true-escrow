"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * STEP 5: Admin UI - Deal Management
 * 
 * 최소 버전 Admin UI:
 * - Deal 리스트
 * - 각 Deal 클릭 시 마일스톤 목록
 * - 상태 배지
 * - [Release 승인] 버튼 (ADMIN 전용)
 */
export default function AdminDealsPage() {
  const router = useRouter();
  const [deals, setDeals] = useState<any[]>([]);
  const [selectedDeal, setSelectedDeal] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>("ADMIN"); // TODO: Get from auth

  useEffect(() => {
    // TODO: Fetch deals from backend
    // For now, use demo data
    setDeals([
      {
        id: "deal-demo-001",
        title: "Used Car Transaction",
        state: "FUNDS_HELD",
        milestones: [
          {
            id: "deposit",
            title: "Deposit",
            amount: 100000,
            currency: "USD",
            status: "RELEASE_REQUESTED",
          },
        ],
      },
    ]);
  }, []);

  const handleDealClick = async (dealId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch(`/api/deals/${dealId}`);
      if (!res.ok) {
        throw new Error("Failed to fetch deal");
      }
      const data = await res.json();
      setSelectedDeal(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReleaseApproval = async (dealId: string, milestoneId: string) => {
    if (!confirm(`Release milestone ${milestoneId}? This action cannot be undone.`)) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080"}/api/admin/deals/${dealId}/milestones/${milestoneId}/release`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-User-Id": "admin-user-id", // TODO: Get from auth
            "X-User-Role": userRole,
          },
        }
      );

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to approve release");
      }

      const data = await res.json();
      alert(`Release approved: ${data.message}`);
      
      // Refresh deal data
      if (selectedDeal) {
        handleDealClick(dealId);
      }
    } catch (err: any) {
      setError(err.message);
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "#f39c12";
      case "PAID_HELD":
      case "FUNDS_HELD":
        return "#00b894";
      case "RELEASE_REQUESTED":
        return "#e67e22";
      case "RELEASED":
        return "#0984e3";
      case "REFUNDED":
        return "#e74c3c";
      default:
        return "#666";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "PENDING":
        return "결제 대기";
      case "PAID_HELD":
      case "FUNDS_HELD":
        return "에스크로 보류 중";
      case "RELEASE_REQUESTED":
        return "Release 요청됨";
      case "RELEASED":
        return "지급 완료";
      case "REFUNDED":
        return "환불 완료";
      default:
        return status;
    }
  };

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
      <h1>Admin - Deal Management</h1>
      
      {error && (
        <div style={{ padding: 12, backgroundColor: "#fee", border: "1px solid #fcc", marginBottom: 16 }}>
          Error: {error}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 24 }}>
        {/* Deal List */}
        <div>
          <h2>Deal List</h2>
          <div style={{ border: "1px solid #ccc", borderRadius: 4 }}>
            {deals.map((deal) => (
              <div
                key={deal.id}
                onClick={() => handleDealClick(deal.id)}
                style={{
                  padding: 12,
                  borderBottom: "1px solid #eee",
                  cursor: "pointer",
                  backgroundColor: selectedDeal?.id === deal.id ? "#f0f0f0" : "white",
                }}
              >
                <div style={{ fontWeight: "bold" }}>{deal.title || deal.id}</div>
                <div style={{ fontSize: 12, color: "#666" }}>
                  State: {deal.state}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Deal Detail */}
        <div>
          {selectedDeal ? (
            <>
              <h2>Deal Detail: {selectedDeal.id}</h2>
              
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontWeight: "bold", marginBottom: 8 }}>Milestones</div>
                
                {selectedDeal.milestones?.map((m: any) => (
                  <div
                    key={m.id}
                    style={{
                      border: "1px solid #ccc",
                      padding: 12,
                      marginBottom: 12,
                      borderRadius: 4,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <div>
                        <div style={{ fontWeight: "bold" }}>{m.title || m.id}</div>
                        <div style={{ fontSize: 12, color: "#666" }}>
                          Amount: ${m.amount || 0} {m.currency || "USD"}
                        </div>
                      </div>
                      <div
                        style={{
                          padding: "4px 12px",
                          borderRadius: 4,
                          backgroundColor: getStatusColor(m.status),
                          color: "white",
                          fontSize: 12,
                          fontWeight: "bold",
                        }}
                      >
                        {getStatusText(m.status)}
                      </div>
                    </div>

                    {/* Release Approval Button (ADMIN only) */}
                    {m.status === "RELEASE_REQUESTED" && userRole === "ADMIN" && (
                      <button
                        onClick={() => handleReleaseApproval(selectedDeal.id, m.id)}
                        disabled={loading}
                        style={{
                          padding: "8px 16px",
                          backgroundColor: loading ? "#b2bec3" : "#0984e3",
                          color: "white",
                          border: "none",
                          borderRadius: 4,
                          cursor: loading ? "not-allowed" : "pointer",
                          fontWeight: "bold",
                        }}
                      >
                        {loading ? "Processing..." : "Release 승인"}
                      </button>
                    )}

                    {m.status === "RELEASE_REQUESTED" && userRole !== "ADMIN" && (
                      <div style={{ fontSize: 12, color: "#666", fontStyle: "italic" }}>
                        Waiting for admin approval...
                      </div>
                    )}
                  </div>
                )) || (
                  <div style={{ padding: 12, color: "#666" }}>No milestones found</div>
                )}
              </div>
            </>
          ) : (
            <div style={{ padding: 24, textAlign: "center", color: "#666" }}>
              Select a deal to view details
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
