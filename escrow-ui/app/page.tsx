"use client";

export default function Home() {
  return (
    <main style={{ padding: 40, maxWidth: 800 }}>
      <h1>Milestone-based Trust Escrow Platform</h1>

      <p>
        We provide a secure escrow service for high-value transactions such as
        used cars, real estate, and digital assets.
      </p>

      <p>
        Payments are held securely and released only when each milestone
        is completed and confirmed by the parties.
      </p>

      <div style={{ marginTop: 24 }}>
        <a href="/deal/new">
          <button>Start a Demo Transaction</button>
        </a>
      </div>

      <hr style={{ margin: "40px 0" }} />

      <nav>
        <a href="/chat">Chat Rooms</a> |{" "}
        <a href="/payment-info">Payment Info</a> |{" "}
        <a href="/terms">Terms</a> |{" "}
        <a href="/privacy">Privacy</a> |{" "}
        <a href="/refund">Refund Policy</a>
      </nav>
    </main>
  );
}
