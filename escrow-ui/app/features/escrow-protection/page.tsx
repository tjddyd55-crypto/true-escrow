export default function EscrowProtection() {
  return (
    <main style={{ padding: "60px 20px", maxWidth: 1000, margin: "0 auto" }}>
      {/* Header */}
      <section style={{ marginBottom: 50 }}>
        <a
          href="/"
          style={{
            color: "#0070f3",
            textDecoration: "none",
            fontSize: "0.95rem",
            marginBottom: 20,
            display: "inline-block",
          }}
        >
          ← Back to Home
        </a>
        <h1 style={{ fontSize: "3rem", fontWeight: "bold", marginBottom: 20 }}>
          Escrow-Based Payment Protection
        </h1>
      </section>

      {/* Overview */}
      <section style={{ marginBottom: 60 }}>
        <h2 style={{ fontSize: "2rem", marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
          🔍 Overview
        </h2>
        <div style={{ fontSize: "1.1rem", color: "#555", lineHeight: 1.8 }}>
          <p style={{ marginBottom: 15 }}>
            Escrow-based payment protection is a structure that holds funds neutrally
            until trust is fully established between transaction parties.
          </p>
          <p>
            <strong>true-escrow</strong> does not immediately transfer payment amounts to sellers,
            but securely holds them in escrow accounts until transaction conditions are met.
          </p>
        </div>
      </section>

      {/* Flow Diagram */}
      <section style={{ marginBottom: 60 }}>
        <h2 style={{ fontSize: "2rem", marginBottom: 30, display: "flex", alignItems: "center", gap: 10 }}>
          🧭 Complete Flow
        </h2>
        <div
          style={{
            padding: 40,
            backgroundColor: "#f8f9fa",
            borderRadius: 12,
            border: "1px solid #e0e0e0",
          }}
        >
          <div style={{ textAlign: "center", fontSize: "1.1rem", lineHeight: 2.5 }}>
            <div style={{ fontWeight: "600", color: "#0070f3" }}>[Buyer Payment]</div>
            <div style={{ fontSize: "1.5rem" }}>↓</div>
            <div style={{ fontWeight: "600", color: "#00b894" }}>[Escrow Hold]</div>
            <div style={{ fontSize: "1.5rem" }}>↓</div>
            <div style={{ fontWeight: "600", color: "#6c5ce7" }}>[Condition Verification]</div>
            <div style={{ fontSize: "1.5rem" }}>↓</div>
            <div style={{ fontWeight: "600", color: "#e74c3c" }}>[Release or Refund]</div>
          </div>
        </div>
      </section>

      {/* Step-by-Step Details */}
      <section style={{ marginBottom: 60 }}>
        <h2 style={{ fontSize: "2rem", marginBottom: 30, display: "flex", alignItems: "center", gap: 10 }}>
          🪜 Step-by-Step Details
        </h2>

        <div style={{ marginBottom: 30 }}>
          <h3 style={{ fontSize: "1.5rem", marginBottom: 15, color: "#0070f3" }}>
            ① Payment Initiated
          </h3>
          <ul style={{ fontSize: "1.1rem", color: "#555", lineHeight: 1.8, paddingLeft: 25 }}>
            <li style={{ marginBottom: 10 }}>Buyer pays for service or product</li>
            <li style={{ marginBottom: 10 }}>Payment amount is not immediately transferred to seller</li>
            <li>Escrow status: <strong>FUNDED</strong></li>
          </ul>
        </div>

        <div style={{ marginBottom: 30 }}>
          <h3 style={{ fontSize: "1.5rem", marginBottom: 15, color: "#00b894" }}>
            ② Escrow Hold
          </h3>
          <ul style={{ fontSize: "1.1rem", color: "#555", lineHeight: 1.8, paddingLeft: 25 }}>
            <li style={{ marginBottom: 10 }}>Funds are held in neutral escrow status</li>
            <li style={{ marginBottom: 10 }}>Neither party can access funds independently</li>
            <li>Automatic protection status maintained in case of disputes</li>
          </ul>
        </div>

        <div style={{ marginBottom: 30 }}>
          <h3 style={{ fontSize: "1.5rem", marginBottom: 15, color: "#6c5ce7" }}>
            ③ Condition Verification
          </h3>
          <ul style={{ fontSize: "1.1rem", color: "#555", lineHeight: 1.8, paddingLeft: 25 }}>
            <li style={{ marginBottom: 10 }}>Verification of conditions defined in contract or transaction</li>
            <li>Examples: Work completion, document submission, inspection approval, etc.</li>
          </ul>
        </div>

        <div style={{ marginBottom: 30 }}>
          <h3 style={{ fontSize: "1.5rem", marginBottom: 15, color: "#e74c3c" }}>
            ④ Fund Processing
          </h3>
          <ul style={{ fontSize: "1.1rem", color: "#555", lineHeight: 1.8, paddingLeft: 25 }}>
            <li style={{ marginBottom: 10 }}>Conditions met → Payment to seller</li>
            <li>Conditions not met / Dispute → Hold or refund</li>
          </ul>
        </div>
      </section>

      {/* Why It's Safe */}
      <section style={{ marginBottom: 60 }}>
        <h2 style={{ fontSize: "2rem", marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
          🔐 Why It's Safe
        </h2>
        <div
          style={{
            padding: 30,
            backgroundColor: "#f0f9ff",
            borderRadius: 12,
            border: "1px solid #bae6fd",
          }}
        >
          <ul style={{ fontSize: "1.1rem", color: "#555", lineHeight: 1.8, paddingLeft: 25 }}>
            <li style={{ marginBottom: 10 }}>Funds are locked until conditions are met</li>
            <li style={{ marginBottom: 10 }}>Seller cannot withdraw independently</li>
            <li style={{ marginBottom: 10 }}>Buyer cannot cancel independently</li>
            <li>All state changes are recorded</li>
          </ul>
        </div>
      </section>

      {/* Use Cases */}
      <section style={{ marginBottom: 60 }}>
        <h2 style={{ fontSize: "2rem", marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
          ✅ When This Structure Is Needed
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: 20,
          }}
        >
          <div style={{ padding: 20, border: "1px solid #e0e0e0", borderRadius: 8 }}>
            <strong style={{ fontSize: "1.1rem" }}>Digital Service Transactions</strong>
          </div>
          <div style={{ padding: 20, border: "1px solid #e0e0e0", borderRadius: 8 }}>
            <strong style={{ fontSize: "1.1rem" }}>Outsourcing / Freelancer Contracts</strong>
          </div>
          <div style={{ padding: 20, border: "1px solid #e0e0e0", borderRadius: 8 }}>
            <strong style={{ fontSize: "1.1rem" }}>Global B2B Transactions</strong>
          </div>
          <div style={{ padding: 20, border: "1px solid #e0e0e0", borderRadius: 8 }}>
            <strong style={{ fontSize: "1.1rem" }}>High-Value or Phased Projects</strong>
          </div>
        </div>
      </section>

      {/* Footer Navigation */}
      <footer style={{ marginTop: 80, paddingTop: 40, borderTop: "1px solid #e0e0e0", textAlign: "center" }}>
        <nav style={{ display: "flex", gap: 20, justifyContent: "center", flexWrap: "wrap", marginBottom: 20 }}>
          <a href="/" style={{ color: "#666", textDecoration: "none" }}>Home</a>
          <a href="/about" style={{ color: "#666", textDecoration: "none" }}>About</a>
          <a href="/pricing" style={{ color: "#666", textDecoration: "none" }}>Pricing</a>
          <a href="/contact" style={{ color: "#666", textDecoration: "none" }}>Contact</a>
        </nav>
      </footer>
    </main>
  );
}
