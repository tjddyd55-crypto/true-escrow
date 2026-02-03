"use client";

import { useEffect, useState } from "react";

/**
 * STEP 7: Escrow 운영 대시보드
 * 
 * 전체 상황판:
 * - KPI 카드 (총 거래 수, FUNDS_HELD 수, RELEASE_REQUESTED 수, DISPUTED 수, 평균 보관 기간, 지연 거래 수)
 * - Deal 타임라인 뷰
 * - 이상 감지 패널
 * - 관리자 액션 패널
 */
export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [deals, setDeals] = useState<any[]>([]);
  const [selectedDeal, setSelectedDeal] = useState<any>(null);
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    setLoading(true);
    try {
      // TODO: Fetch from backend API
      // For now, use mock data
      setStats({
        totalDeals: 42,
        fundsHeld: 15,
        releaseRequested: 8,
        disputed: 3,
        avgHoldingDays: 4.2,
        delayedDeals: 5,
      });
      
      setDeals([
        {
          id: "deal-demo-001",
          title: "Used Car Transaction",
          state: "FUNDS_HELD",
          milestones: [
            { id: "deposit", status: "RELEASE_REQUESTED", amount: 100000, createdAt: "2026-02-01T10:00:00Z" },
          ],
        },
      ]);
      
      setAnomalies([
        {
          type: "FUNDS_HELD_OVER_7_DAYS",
          dealId: "deal-001",
          milestoneId: "deposit",
          days: 8,
          message: "Funds held for 8 days",
        },
        {
          type: "RELEASE_REQUESTED_OVER_48H",
          dealId: "deal-002",
          milestoneId: "deposit",
          hours: 50,
          message: "Release requested 50 hours ago",
        },
      ]);
    } catch (err: any) {
      console.error("Failed to load dashboard:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDealClick(dealId: string) {
    try {
      const res = await fetch(`/api/deals/${dealId}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedDeal(data);
      }
    } catch (err: any) {
      console.error("Failed to load deal:", err);
    }
  }

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: "0 auto" }}>
      <h1>Escrow 운영 대시보드</h1>
      
      {loading && <div>Loading...</div>}
      
      {/* 1. KPI Cards */}
      {stats && (
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(3, 1fr)", 
          gap: 16, 
          marginBottom: 24 
        }}>
          <KPICard 
            title="총 거래 수" 
            value={stats.totalDeals} 
            color="#0984e3"
          />
          <KPICard 
            title="에스크로 보류 중" 
            value={stats.fundsHeld} 
            color="#00b894"
          />
          <KPICard 
            title="Release 요청 대기" 
            value={stats.releaseRequested} 
            color="#e67e22"
          />
          <KPICard 
            title="분쟁 중" 
            value={stats.disputed} 
            color="#e74c3c"
          />
          <KPICard 
            title="평균 보관 기간" 
            value={`${stats.avgHoldingDays}일`} 
            color="#6c5ce7"
          />
          <KPICard 
            title="지연 거래" 
            value={stats.delayedDeals} 
            color="#d63031"
          />
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        {/* 2. Deal Timeline View */}
        <div>
          <h2>Deal 타임라인</h2>
          <div style={{ border: "1px solid #ccc", borderRadius: 4, padding: 16 }}>
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
                {selectedDeal?.id === deal.id && selectedDeal.milestones && (
                  <div style={{ marginTop: 12, paddingLeft: 16, borderLeft: "2px solid #0984e3" }}>
                    <div style={{ fontSize: 14, fontWeight: "bold", marginBottom: 8 }}>타임라인:</div>
                    {selectedDeal.milestones.map((m: any, idx: number) => (
                      <div key={m.id} style={{ marginBottom: 8, fontSize: 12 }}>
                        <div style={{ fontWeight: "bold" }}>마일스톤 {idx + 1}: {m.id}</div>
                        <div style={{ color: "#666" }}>
                          상태: {m.status} | 금액: ${m.amount || 0}
                        </div>
                        {m.orderId && (
                          <div style={{ color: "#666", fontSize: 11 }}>
                            Order ID: {m.orderId}
                          </div>
                        )}
                        {m.paidAt && (
                          <div style={{ color: "#666", fontSize: 11 }}>
                            Paid: {new Date(m.paidAt).toLocaleString()}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 3. 이상 감지 패널 */}
        <div>
          <h2>이상 감지</h2>
          <div style={{ border: "1px solid #ccc", borderRadius: 4, padding: 16 }}>
            {anomalies.length === 0 ? (
              <div style={{ color: "#666", textAlign: "center", padding: 24 }}>
                이상 사항 없음
              </div>
            ) : (
              anomalies.map((anomaly: any, idx: number) => (
                <div
                  key={idx}
                  style={{
                    padding: 12,
                    marginBottom: 8,
                    backgroundColor: "#fff3cd",
                    border: "1px solid #ffc107",
                    borderRadius: 4,
                  }}
                >
                  <div style={{ fontWeight: "bold", color: "#856404" }}>
                    {anomaly.type}
                  </div>
                  <div style={{ fontSize: 12, color: "#856404" }}>
                    {anomaly.message}
                  </div>
                  <div style={{ fontSize: 11, color: "#856404", marginTop: 4 }}>
                    Deal: {anomaly.dealId} | Milestone: {anomaly.milestoneId}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 4. 관리자 액션 패널 */}
      <div style={{ marginTop: 24 }}>
        <h2>관리자 액션</h2>
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(4, 1fr)", 
          gap: 16 
        }}>
          <ActionButton 
            label="Release 승인 대기" 
            count={stats?.releaseRequested || 0}
            onClick={() => window.location.href = "/admin/deals"}
          />
          <ActionButton 
            label="분쟁 처리 대기" 
            count={stats?.disputed || 0}
            onClick={() => window.location.href = "/admin/disputes"}
          />
          <ActionButton 
            label="이상 거래 확인" 
            count={stats?.delayedDeals || 0}
            onClick={() => {}}
          />
          <ActionButton 
            label="온체인 기록" 
            count={0}
            onClick={() => {}}
          />
        </div>
      </div>
    </div>
  );
}

function KPICard({ title, value, color }: { title: string; value: string | number; color: string }) {
  return (
    <div style={{
      padding: 16,
      backgroundColor: "white",
      border: "1px solid #ddd",
      borderRadius: 4,
      borderTop: `4px solid ${color}`,
    }}>
      <div style={{ fontSize: 12, color: "#666", marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 24, fontWeight: "bold", color }}>{value}</div>
    </div>
  );
}

function ActionButton({ label, count, onClick }: { label: string; count: number; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: 16,
        backgroundColor: "white",
        border: "1px solid #ddd",
        borderRadius: 4,
        cursor: "pointer",
        textAlign: "left",
      }}
    >
      <div style={{ fontSize: 14, fontWeight: "bold", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 20, color: "#0984e3" }}>{count}건</div>
    </button>
  );
}
