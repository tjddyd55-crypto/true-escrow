export default function GlobalTransactions() {
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
          Built for Global Transactions
        </h1>
      </section>

      {/* Overview */}
      <section style={{ marginBottom: 60 }}>
        <h2 style={{ fontSize: "2rem", marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
          🔍 Overview
        </h2>
        <div style={{ fontSize: "1.1rem", color: "#555", lineHeight: 1.8 }}>
          <p>
            <strong>true-escrow</strong> is designed for global transaction use cases,
            helping businesses manage milestone-based transactions across borders.
          </p>
        </div>
      </section>

      {/* Global Transaction Challenges */}
      <section style={{ marginBottom: 60 }}>
        <h2 style={{ fontSize: "2rem", marginBottom: 30, display: "flex", alignItems: "center", gap: 10 }}>
          🌍 Global Transaction Challenges
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: 20,
          }}
        >
          <div
            style={{
              padding: 25,
              border: "1px solid #ffe0e0",
              borderRadius: 8,
              backgroundColor: "#fff5f5",
            }}
          >
            <h3 style={{ fontSize: "1.2rem", marginBottom: 10, color: "#c92a2a" }}>
              Country-Specific Legal & Business Practice Differences
            </h3>
            <p style={{ fontSize: "1rem", color: "#666", lineHeight: 1.6 }}>
              Uncertainty due to different legal systems and business practices
            </p>
          </div>
          <div
            style={{
              padding: 25,
              border: "1px solid #ffe0e0",
              borderRadius: 8,
              backgroundColor: "#fff5f5",
            }}
          >
            <h3 style={{ fontSize: "1.2rem", marginBottom: 10, color: "#c92a2a" }}>
              Advance Payment Risk
            </h3>
            <p style={{ fontSize: "1rem", color: "#666", lineHeight: 1.6 }}>
              Risk that the party who pays first may not receive promised fulfillment
            </p>
          </div>
          <div
            style={{
              padding: 25,
              border: "1px solid #ffe0e0",
              borderRadius: 8,
              backgroundColor: "#fff5f5",
            }}
          >
            <h3 style={{ fontSize: "1.2rem", marginBottom: 10, color: "#c92a2a" }}>
              Refund & Dispute Resolution Difficulty
            </h3>
            <p style={{ fontSize: "1rem", color: "#666", lineHeight: 1.6 }}>
              Complexity and cost of resolving cross-border disputes
            </p>
          </div>
          <div
            style={{
              padding: 25,
              border: "1px solid #ffe0e0",
              borderRadius: 8,
              backgroundColor: "#fff5f5",
            }}
          >
            <h3 style={{ fontSize: "1.2rem", marginBottom: 10, color: "#c92a2a" }}>
              Intermediary Dependency
            </h3>
            <p style={{ fontSize: "1rem", color: "#666", lineHeight: 1.6 }}>
              Difficulty conducting transactions without a trusted intermediary
            </p>
          </div>
        </div>
      </section>

      {/* true-escrow Approach */}
      <section style={{ marginBottom: 60 }}>
        <h2 style={{ fontSize: "2rem", marginBottom: 30, display: "flex", alignItems: "center", gap: 10 }}>
          🧭 true-escrow Approach
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
            <div style={{ fontWeight: "600", color: "#0070f3" }}>[Country A Buyer]</div>
            <div style={{ fontSize: "1.5rem" }}>↓</div>
            <div style={{ fontWeight: "600", color: "#00b894", fontSize: "1.2rem" }}>[Escrow]</div>
            <div style={{ fontSize: "1.5rem" }}>↓</div>
            <div style={{ fontWeight: "600", color: "#6c5ce7" }}>[Country B Seller]</div>
          </div>
        </div>
      </section>

      {/* Key Features */}
      <section style={{ marginBottom: 60 }}>
        <h2 style={{ fontSize: "2rem", marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
          🔐 Key Features
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 20,
            marginTop: 30,
          }}
        >
          <div
            style={{
              padding: 25,
              border: "1px solid #bae6fd",
              borderRadius: 8,
              backgroundColor: "#f0f9ff",
            }}
          >
            <h3 style={{ fontSize: "1.2rem", marginBottom: 10, color: "#0369a1" }}>
              Neutral Structure Regardless of Nationality
            </h3>
            <p style={{ fontSize: "1rem", color: "#666", lineHeight: 1.6 }}>
              Same level of protection and rules apply to parties from any country
            </p>
          </div>
          <div
            style={{
              padding: 25,
              border: "1px solid #bae6fd",
              borderRadius: 8,
              backgroundColor: "#f0f9ff",
            }}
          >
            <h3 style={{ fontSize: "1.2rem", marginBottom: 10, color: "#0369a1" }}>
              Risk Distribution Through Phased Payments
            </h3>
            <p style={{ fontSize: "1rem", color: "#666", lineHeight: 1.6 }}>
              Full amount risk distributed across phases through milestone-based approach
            </p>
          </div>
          <div
            style={{
              padding: 25,
              border: "1px solid #bae6fd",
              borderRadius: 8,
              backgroundColor: "#f0f9ff",
            }}
          >
            <h3 style={{ fontSize: "1.2rem", marginBottom: 10, color: "#0369a1" }}>
              Clear Transaction Status
            </h3>
            <p style={{ fontSize: "1rem", color: "#666", lineHeight: 1.6 }}>
              Real-time transparent sharing of transaction progress
            </p>
          </div>
          <div
            style={{
              padding: 25,
              border: "1px solid #bae6fd",
              borderRadius: 8,
              backgroundColor: "#f0f9ff",
            }}
          >
            <h3 style={{ fontSize: "1.2rem", marginBottom: 10, color: "#0369a1" }}>
              Record-Based Dispute Response
            </h3>
            <p style={{ fontSize: "1rem", color: "#666", lineHeight: 1.6 }}>
              All transaction stages recorded for use in dispute resolution
            </p>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section style={{ marginBottom: 60 }}>
        <h2 style={{ fontSize: "2rem", marginBottom: 30, display: "flex", alignItems: "center", gap: 10 }}>
          ✅ Use Cases
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: 20,
          }}
        >
          <div style={{ padding: 25, border: "1px solid #e0e0e0", borderRadius: 8 }}>
            <h3 style={{ fontSize: "1.2rem", marginBottom: 10 }}>Global Outsourcing Projects</h3>
            <p style={{ fontSize: "1rem", color: "#666", lineHeight: 1.6 }}>
              Phased project execution with overseas developers/designers
            </p>
          </div>
          <div style={{ padding: 25, border: "1px solid #e0e0e0", borderRadius: 8 }}>
            <h3 style={{ fontSize: "1.2rem", marginBottom: 10 }}>Overseas Supply Contracts</h3>
            <p style={{ fontSize: "1rem", color: "#666", lineHeight: 1.6 }}>
              Phased delivery and inspection-based transactions with manufacturers
            </p>
          </div>
          <div style={{ padding: 25, border: "1px solid #e0e0e0", borderRadius: 8 }}>
            <h3 style={{ fontSize: "1.2rem", marginBottom: 10 }}>Digital Content Transactions</h3>
            <p style={{ fontSize: "1rem", color: "#666", lineHeight: 1.6 }}>
              Software and media license transactions in global markets
            </p>
          </div>
          <div style={{ padding: 25, border: "1px solid #e0e0e0", borderRadius: 8 }}>
            <h3 style={{ fontSize: "1.2rem", marginBottom: 10 }}>Physical Asset Transactions (Phased Delivery)</h3>
            <p style={{ fontSize: "1rem", color: "#666", lineHeight: 1.6 }}>
              Goods transactions requiring phased delivery from overseas
            </p>
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
