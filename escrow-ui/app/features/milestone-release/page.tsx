export default function MilestoneRelease() {
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
          Milestone-Based Fund Release
        </h1>
      </section>

      {/* Overview */}
      <section style={{ marginBottom: 60 }}>
        <h2 style={{ fontSize: "2rem", marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
          🔍 Overview
        </h2>
        <div style={{ fontSize: "1.1rem", color: "#555", lineHeight: 1.8 }}>
          <p style={{ marginBottom: 15 }}>
            Milestone-based fund release divides a project into multiple phases,
            releasing funds incrementally as each phase is completed.
          </p>
          <p>
            By not paying the full amount at once, this structure minimizes risk
            while maintaining transparent transactions.
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
            <div style={{ fontWeight: "600", color: "#0070f3" }}>[Total Payment Amount]</div>
            <div style={{ fontSize: "1.5rem" }}>↓</div>
            <div style={{ fontWeight: "600", color: "#00b894" }}>
              [Milestone 1 Completed] → Partial Payment
            </div>
            <div style={{ fontSize: "1.5rem" }}>↓</div>
            <div style={{ fontWeight: "600", color: "#6c5ce7" }}>
              [Milestone 2 Completed] → Partial Payment
            </div>
            <div style={{ fontSize: "1.5rem" }}>↓</div>
            <div style={{ fontWeight: "600", color: "#e74c3c" }}>
              [Milestone 3 Completed] → Final Payment
            </div>
          </div>
        </div>
      </section>

      {/* Example Scenario */}
      <section style={{ marginBottom: 60 }}>
        <h2 style={{ fontSize: "2rem", marginBottom: 30, display: "flex", alignItems: "center", gap: 10 }}>
          🪜 Example Scenario
        </h2>
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: "1.2rem", fontWeight: "600", marginBottom: 20 }}>
            Total Project Amount: <span style={{ color: "#0070f3" }}>$10,000</span>
          </p>
        </div>
        <div
          style={{
            overflowX: "auto",
            border: "1px solid #e0e0e0",
            borderRadius: 8,
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "1.1rem",
            }}
          >
            <thead>
              <tr style={{ backgroundColor: "#f8f9fa" }}>
                <th style={{ padding: "15px", textAlign: "left", borderBottom: "2px solid #e0e0e0" }}>
                  Milestone
                </th>
                <th style={{ padding: "15px", textAlign: "left", borderBottom: "2px solid #e0e0e0" }}>
                  Condition
                </th>
                <th style={{ padding: "15px", textAlign: "right", borderBottom: "2px solid #e0e0e0" }}>
                  Payment Amount
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: "15px", borderBottom: "1px solid #f0f0f0" }}>
                  <strong>Milestone 1</strong>
                </td>
                <td style={{ padding: "15px", borderBottom: "1px solid #f0f0f0" }}>
                  Initial Design Completed
                </td>
                <td style={{ padding: "15px", textAlign: "right", borderBottom: "1px solid #f0f0f0", fontWeight: "600" }}>
                  $3,000
                </td>
              </tr>
              <tr>
                <td style={{ padding: "15px", borderBottom: "1px solid #f0f0f0" }}>
                  <strong>Milestone 2</strong>
                </td>
                <td style={{ padding: "15px", borderBottom: "1px solid #f0f0f0" }}>
                  Mid-term Deliverable Inspection
                </td>
                <td style={{ padding: "15px", textAlign: "right", borderBottom: "1px solid #f0f0f0", fontWeight: "600" }}>
                  $4,000
                </td>
              </tr>
              <tr>
                <td style={{ padding: "15px" }}>
                  <strong>Milestone 3</strong>
                </td>
                <td style={{ padding: "15px" }}>
                  Final Delivery Approval
                </td>
                <td style={{ padding: "15px", textAlign: "right", fontWeight: "600" }}>
                  $3,000
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Step-by-Step Details */}
      <section style={{ marginBottom: 60 }}>
        <h2 style={{ fontSize: "2rem", marginBottom: 30, display: "flex", alignItems: "center", gap: 10 }}>
          🪜 Step-by-Step Details
        </h2>

        <div style={{ marginBottom: 30 }}>
          <h3 style={{ fontSize: "1.5rem", marginBottom: 15, color: "#0070f3" }}>
            ① Milestone Setup
          </h3>
          <ul style={{ fontSize: "1.1rem", color: "#555", lineHeight: 1.8, paddingLeft: 25 }}>
            <li style={{ marginBottom: 10 }}>Define milestones at transaction start</li>
            <li style={{ marginBottom: 10 }}>For each phase:</li>
            <ul style={{ paddingLeft: 30, marginTop: 10 }}>
              <li style={{ marginBottom: 8 }}>Conditions</li>
              <li style={{ marginBottom: 8 }}>Payment amount</li>
              <li>Clear approval authority</li>
            </ul>
          </ul>
        </div>

        <div style={{ marginBottom: 30 }}>
          <h3 style={{ fontSize: "1.5rem", marginBottom: 15, color: "#00b894" }}>
            ② Phase Completion
          </h3>
          <ul style={{ fontSize: "1.1rem", color: "#555", lineHeight: 1.8, paddingLeft: 25 }}>
            <li style={{ marginBottom: 10 }}>Seller requests milestone completion</li>
            <li>Buyer inspects and approves</li>
          </ul>
        </div>

        <div style={{ marginBottom: 30 }}>
          <h3 style={{ fontSize: "1.5rem", marginBottom: 15, color: "#6c5ce7" }}>
            ③ Partial Payment
          </h3>
          <ul style={{ fontSize: "1.1rem", color: "#555", lineHeight: 1.8, paddingLeft: 25 }}>
            <li style={{ marginBottom: 10 }}>Funds are released after milestone completion and approval</li>
            <li>Remaining funds continue to be held in escrow</li>
          </ul>
        </div>

        <div style={{ marginBottom: 30 }}>
          <h3 style={{ fontSize: "1.5rem", marginBottom: 15, color: "#e74c3c" }}>
            ④ Next Phase Progression
          </h3>
          <ul style={{ fontSize: "1.1rem", color: "#555", lineHeight: 1.8, paddingLeft: 25 }}>
            <li style={{ marginBottom: 10 }}>Proceed to next milestone after previous phase completion</li>
            <li>Transaction ends when all phases are complete</li>
          </ul>
        </div>
      </section>

      {/* Why Transparency Is Maintained */}
      <section style={{ marginBottom: 60 }}>
        <h2 style={{ fontSize: "2rem", marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
          🔐 Why Transparency Is Maintained
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
            <li style={{ marginBottom: 10 }}>Payment criteria are clearly defined in advance</li>
            <li style={{ marginBottom: 10 }}>Step-by-step approval records maintained</li>
            <li style={{ marginBottom: 10 }}>Fund flow can be tracked in real-time</li>
            <li>In case of disputes, it's clear at which stage the problem occurred</li>
          </ul>
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
