"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function DealDetail() {
  const params = useParams();
  const [deal, setDeal] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    console.log("===== STEP 4: FRONTEND DEAL PAGE LOAD =====");
    console.log("Deal ID:", params.id);
    console.log("Fetching deal data...");
    
    fetch(`/api/deals/${params.id}`)
      .then(async (res) => {
        console.log("API response status:", res.status);
        const data = await res.json();
        console.log("API response data:", JSON.stringify(data, null, 2));
        
        if (!res.ok) {
          throw new Error(data.message || "API Error");
        }
        
        console.log("Deal data received:");
        console.log("  - Deal ID:", data.id);
        console.log("  - Milestones count:", data.milestones?.length || 0);
        if (data.milestones) {
          data.milestones.forEach((m: any, idx: number) => {
            console.log(`  - Milestone ${idx + 1}: id=${m.id}, status=${m.status}, title=${m.title}`);
          });
        }
        
        return data;
      })
      .then((data) => {
        console.log("Setting deal state...");
        setDeal(data);
        console.log("===== STEP 4: FRONTEND DEAL PAGE LOAD SUCCESS =====");
      })
      .catch((err) => {
        console.error("===== STEP 4: FRONTEND DEAL PAGE LOAD ERROR =====");
        console.error("Error:", err);
        console.error("Error message:", err.message);
        setError(err.message);
      });
  }, [params.id]);

  async function proceedPayment(dealId: string) {
    if (loading) return; // 버튼 연타 방지
    
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch(`/api/deals/${dealId}/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      const data = await res.json();
      
      if (!res.ok || data.error) {
        // 500/401 등 에러 처리
        const errorMessage = data.error || `HTTP ${res.status}: Payment setup failed`;
        const requestId = data.requestId || "unknown";
        
        setError(`${errorMessage} (Request ID: ${requestId})`);
        setLoading(false);
        return;
      }
      
      if (data.checkoutUrl) {
        // 성공: Lemon Checkout으로 리다이렉트
        window.location.href = data.checkoutUrl;
      } else {
        setError("Checkout URL not found in response");
        setLoading(false);
      }
    } catch (err: any) {
      setError(`Network error: ${err.message}`);
      setLoading(false);
    }
  }

  if (error) {
    return (
      <main style={{ padding: 40 }}>
        <h2 style={{ color: "#d63031", marginBottom: 16 }}>Payment Setup Failed</h2>
        <div style={{ 
          border: "1px solid #ff6b6b", 
          backgroundColor: "#ffe0e0", 
          padding: 16, 
          marginBottom: 20,
          borderRadius: 4 
        }}>
          <p style={{ color: "#d63031", fontWeight: "bold", margin: "0 0 8px 0" }}>
            ⚠️ {error}
          </p>
          <p style={{ fontSize: 12, color: "#666", margin: "8px 0 0 0" }}>
            Please check:
          </p>
          <ul style={{ fontSize: 12, color: "#666", margin: "8px 0 0 20px", padding: 0 }}>
            <li><code>/api/health</code> endpoint for deployment status</li>
            <li>Railway logs for detailed error trace</li>
            <li>Environment variables (LEMON_API_KEY, LEMON_STORE_ID, LEMON_VARIANT_ID)</li>
          </ul>
        </div>
        <button 
          onClick={() => {
            setError(null);
            setLoading(false);
          }}
          style={{ 
            padding: "8px 16px",
            backgroundColor: "#74b9ff",
            color: "white",
            border: "none",
            borderRadius: 4,
            cursor: "pointer"
          }}
        >
          Try Again
        </button>
      </main>
    );
  }

  if (!deal) return <div>Loading...</div>;

  return (
    <main style={{ padding: 40 }}>
      <h2>Deal ID: {deal.id}</h2>

      {deal.error && (
        <div style={{ 
          border: "1px solid #ff6b6b", 
          backgroundColor: "#ffe0e0", 
          padding: 16, 
          marginBottom: 20,
          borderRadius: 4 
        }}>
          <p style={{ color: "#d63031", fontWeight: "bold", margin: 0 }}>
            ⚠️ Payment Setup Error
          </p>
          <p style={{ color: "#666", marginTop: 8, marginBottom: 0 }}>
            {deal.message}
          </p>
          <p style={{ fontSize: 12, color: "#999", marginTop: 8, marginBottom: 0 }}>
            Please configure Lemon Squeezy credentials in .env.local file.
          </p>
        </div>
      )}

      {deal.milestones?.map((m: any) => {
        // STEP 4: Status text mapping
        const statusText = m.status === "PENDING" 
          ? "결제 대기" 
          : m.status === "FUNDED" 
          ? "에스크로 보류 중" 
          : m.status === "RELEASED"
          ? "지급 완료"
          : m.status;
        
        const statusColor = m.status === "PENDING" 
          ? "#f39c12" 
          : m.status === "FUNDED" 
          ? "#00b894" 
          : m.status === "RELEASED"
          ? "#0984e3"
          : "#666";
        
        // STEP 4: Logging (outside JSX to avoid parsing issues)
        console.log("===== STEP 4: RENDERING MILESTONE =====");
        console.log("Milestone ID:", m.id);
        console.log("Status:", m.status, "->", statusText);
        console.log("Color:", statusColor);
        
        return (
          <div key={m.id} style={{ border: "1px solid #ccc", padding: 12, marginBottom: 12 }}>
            <p><b>{m.title || m.id}</b></p>
            <p>Amount: ${m.amount || 0} {m.currency || "USD"}</p>
            <p style={{ color: statusColor, fontWeight: "bold" }}>
              Status: {statusText}
            </p>

            {m.status === "PENDING" && (
              <>
                <p style={{ fontSize: 12, color: "#666", marginTop: 12, marginBottom: 8 }}>
                  By proceeding to payment, funds will be held in escrow.
                </p>

                <button 
                  onClick={() => proceedPayment(params.id as string)}
                  disabled={loading}
                  style={{ 
                    padding: "12px 24px",
                    fontSize: 16,
                    fontWeight: "bold",
                    backgroundColor: loading ? "#b2bec3" : "#00b894",
                    color: "white",
                    border: "none",
                    borderRadius: 4,
                    opacity: loading ? 0.6 : 1, 
                    cursor: loading ? "not-allowed" : "pointer",
                    transition: "all 0.2s"
                  }}
                >
                  {loading ? "Processing..." : "Proceed Payment"}
                </button>
              </>
            )}
            
            {m.status === "FUNDED" && (
              <p style={{ fontSize: 12, color: "#00b894", marginTop: 12, marginBottom: 8 }}>
                ✅ Funds are held in escrow. Waiting for release.
              </p>
            )}
            
            {m.status === "RELEASED" && (
              <p style={{ fontSize: 12, color: "#0984e3", marginTop: 12, marginBottom: 8 }}>
                ✅ Payment completed and released.
              </p>
            )}
          </div>
        );
      })}
    </main>
  );
}
