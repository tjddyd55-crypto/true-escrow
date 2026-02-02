"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function DealDetail() {
  const params = useParams();
  const [deal, setDeal] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/deals/${params.id}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || "API Error");
        }
        return data;
      })
      .then(setDeal)
      .catch((err) => {
        console.error(err);
        setError(err.message);
      });
  }, [params.id]);

  if (error) {
    return (
      <main style={{ padding: 40 }}>
        <h2>Error</h2>
        <p>{error}</p>
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

      {deal.milestones?.map((m: any) => (
        <div key={m.id} style={{ border: "1px solid #ccc", padding: 12, marginBottom: 12 }}>
          <p><b>{m.title}</b></p>
          <p>Amount: ${m.amount}</p>
          <p>Status: {m.status}</p>

          <p style={{ fontSize: 12, color: "#666", marginTop: 12, marginBottom: 8 }}>
            By proceeding to payment, funds will be held in escrow.
          </p>

          {m.checkoutUrl ? (
            <a href={m.checkoutUrl} target="_blank" rel="noopener noreferrer">
              <button>Proceed Payment</button>
            </a>
          ) : (
            <button disabled style={{ opacity: 0.5, cursor: "not-allowed" }}>
              Payment Unavailable
            </button>
          )}
        </div>
      ))}
    </main>
  );
}
