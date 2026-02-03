"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * MASTER TASK STEP 5: User Dashboard
 * 
 * 내가 참여한 Deal 리스트:
 * - 각 Deal의 현재 상태
 * - 마일스톤별 상태
 * - 내가 할 수 있는 다음 액션
 */
export default function UserDashboard() {
  const router = useRouter();
  const [deals, setDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [userId] = useState<string>("user-001"); // TODO: Get from auth

  useEffect(() => {
    loadDeals();
  }, []);

  async function loadDeals() {
    setLoading(true);
    try {
      // TODO: Fetch from backend API
      // GET /api/deals?buyerId={userId} or /api/deals?sellerId={userId}
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";
      
      // For now, use mock data
      setDeals([
        {
          id: "deal-demo-001",
          title: "Used Car Transaction",
          state: "FUNDS_HELD",
          myRole: "BUYER",
          milestones: [
            {
              id: "deposit",
              title: "Deposit",
              status: "EVIDENCE_SUBMITTED",
              amount: 100000,
              currency: "USD",
              canUploadEvidence: false,
              canRequestRelease: true,
              canDispute: true,
            },
          ],
        },
      ]);
    } catch (err: any) {
      console.error("Failed to load deals:", err);
    } finally {
      setLoading(false);
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "#f39c12";
      case "FUNDS_HELD":
      case "PAID_HELD":
        return "#00b894";
      case "EVIDENCE_SUBMITTED":
        return "#74b9ff";
      case "RELEASE_REQUESTED":
        return "#e67e22";
      case "RELEASED":
        return "#0984e3";
      case "DISPUTED":
        return "#d63031";
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
      case "FUNDS_HELD":
      case "PAID_HELD":
        return "에스크로 보류 중";
      case "EVIDENCE_SUBMITTED":
        return "증빙 제출 완료";
      case "RELEASE_REQUESTED":
        return "Release 요청됨";
      case "RELEASED":
        return "지급 완료";
      case "DISPUTED":
        return "분쟁 중";
      case "REFUNDED":
        return "환불 완료";
      default:
        return status;
    }
  };

  const getNextAction = (milestone: any, myRole: string) => {
    if (milestone.status === "FUNDS_HELD" || milestone.status === "PAID_HELD") {
      return "증빙 업로드";
    }
    if (milestone.status === "EVIDENCE_SUBMITTED") {
      return "Release 요청";
    }
    if (milestone.status === "RELEASE_REQUESTED") {
      return "관리자 승인 대기 중";
    }
    if (milestone.status === "DISPUTED") {
      return "관리자 판단 대기 중";
    }
    return null;
  };

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
      <h1>내 거래 대시보드</h1>
      
      {loading && <div>Loading...</div>}
      
      {deals.length === 0 && !loading && (
        <div style={{ padding: 24, textAlign: "center", color: "#666" }}>
          참여한 거래가 없습니다.
        </div>
      )}

      {deals.map((deal) => (
        <div
          key={deal.id}
          style={{
            border: "1px solid #ccc",
            borderRadius: 4,
            padding: 16,
            marginBottom: 16,
            cursor: "pointer",
          }}
          onClick={() => router.push(`/deal/${deal.id}`)}
        >
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
            <div>
              <h3 style={{ margin: 0 }}>{deal.title || deal.id}</h3>
              <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
                Deal 상태: {deal.state} | 내 역할: {deal.myRole}
              </div>
            </div>
          </div>

          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 14, fontWeight: "bold", marginBottom: 8 }}>마일스톤:</div>
            {deal.milestones?.map((m: any) => (
              <div
                key={m.id}
                style={{
                  border: "1px solid #eee",
                  borderRadius: 4,
                  padding: 12,
                  marginBottom: 8,
                  backgroundColor: "#f9f9f9",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <div>
                    <div style={{ fontWeight: "bold" }}>{m.title || m.id}</div>
                    <div style={{ fontSize: 12, color: "#666" }}>
                      금액: ${m.amount || 0} {m.currency || "USD"}
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

                {/* 다음 액션 */}
                {getNextAction(m, deal.myRole) && (
                  <div style={{ fontSize: 12, color: "#666", marginTop: 8 }}>
                    다음 액션: {getNextAction(m, deal.myRole)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
