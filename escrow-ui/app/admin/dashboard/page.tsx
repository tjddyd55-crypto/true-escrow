"use client";

import { useEffect, useState } from "react";

/**
 * STEP 7: Escrow Operations Dashboard
 * 
 * Overview:
 * - KPI Cards (Total Transactions, In Escrow, Release Requests, In Dispute, Average Holding Period, Delayed Transactions)
 * - Deal Timeline View
 * - Anomaly Detection Panel
 * - Admin Actions Panel
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
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";
      
      // Fetch stats
      const statsRes = await fetch(`${apiBaseUrl}/api/admin/dashboard/stats`);
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      } else {
        // Fallback to mock data
        setStats({
          totalDeals: 0,
          fundsHeld: 0,
          releaseRequested: 0,
          disputed: 0,
          avgHoldingDays: 0.0,
          delayedDeals: 0,
        });
      }
      
      // Fetch anomalies
      const anomaliesRes = await fetch(`${apiBaseUrl}/api/admin/dashboard/anomalies`);
      if (anomaliesRes.ok) {
        const anomaliesData = await anomaliesRes.json();
        setAnomalies(anomaliesData);
      } else {
        setAnomalies([]);
      }
      
      // TODO: Fetch deals list
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
    } catch (err: any) {
      console.error("Failed to load dashboard:", err);
      // Fallback to empty data
      setStats({
        totalDeals: 0,
        fundsHeld: 0,
        releaseRequested: 0,
        disputed: 0,
        avgHoldingDays: 0.0,
        delayedDeals: 0,
      });
      setAnomalies([]);
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
      <h1>Escrow Operations Dashboard</h1>
      
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
            title="Total Transactions" 
            value={stats.totalDeals} 
            color="#0984e3"
          />
          <KPICard 
            title="In Escrow (Simulated)" 
            value={stats.fundsHeld} 
            color="#00b894"
          />
          <KPICard 
            title="Release Requests Pending" 
            value={stats.releaseRequested} 
            color="#e67e22"
          />
          <KPICard 
            title="In Dispute" 
            value={stats.disputed} 
            color="#e74c3c"
          />
          <KPICard 
            title="Average Holding Period" 
            value={`${stats.avgHoldingDays} days`} 
            color="#6c5ce7"
          />
          <KPICard 
            title="Delayed Transactions" 
            value={stats.delayedDeals} 
            color="#d63031"
          />
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        {/* 2. Deal Timeline View */}
        <div>
          <h2>Deal Timeline</h2>
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
                    <div style={{ fontSize: 14, fontWeight: "bold", marginBottom: 8 }}>Timeline:</div>
                    {selectedDeal.milestones.map((m: any, idx: number) => (
                      <div key={m.id} style={{ marginBottom: 8, fontSize: 12 }}>
                        <div style={{ fontWeight: "bold" }}>Milestone {idx + 1}: {m.id}</div>
                        <div style={{ color: "#666" }}>
                          Status: {m.status} | Amount: ${m.amount || 0}
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

        {/* 3. Anomaly Detection Panel */}
        <div>
          <h2>Anomaly Detection</h2>
          <div style={{ border: "1px solid #ccc", borderRadius: 4, padding: 16 }}>
            {anomalies.length === 0 ? (
              <div style={{ color: "#666", textAlign: "center", padding: 24 }}>
                No Anomalies
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

      {/* 4. Admin Actions Panel */}
      <div style={{ marginTop: 24 }}>
        <h2>Admin Actions</h2>
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(4, 1fr)", 
          gap: 16 
        }}>
          <ActionButton 
            label="Pending Release Approvals" 
            count={stats?.releaseRequested || 0}
            onClick={() => window.location.href = "/admin/deals"}
          />
          <ActionButton 
            label="Pending Dispute Resolutions" 
            count={stats?.disputed || 0}
            onClick={() => window.location.href = "/admin/disputes"}
          />
          <ActionButton 
            label="Review Anomalies" 
            count={stats?.delayedDeals || 0}
            onClick={() => {}}
          />
          <ActionButton 
            label="On-Chain Records" 
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
      <div style={{ fontSize: 20, color: "#0984e3" }}>{count} items</div>
    </button>
  );
}
