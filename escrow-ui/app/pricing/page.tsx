export default function Pricing() {
  return (
    <main style={{ padding: "60px 20px", maxWidth: 1200, margin: "0 auto" }}>
      <section style={{ textAlign: "center", marginBottom: 60 }}>
        <h1 style={{ fontSize: "3rem", fontWeight: "bold", marginBottom: 20 }}>
          Pricing
        </h1>
        <p style={{ fontSize: "1.2rem", color: "#666", maxWidth: 600, margin: "0 auto" }}>
          Choose the plan that fits your transaction needs
        </p>
      </section>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: 30,
          marginTop: 50,
        }}
      >
        {/* Free Plan */}
        <div
          style={{
            padding: 40,
            border: "2px solid #e0e0e0",
            borderRadius: 12,
            textAlign: "center",
          }}
        >
          <h2 style={{ fontSize: "1.8rem", marginBottom: 10 }}>Free</h2>
          <div style={{ fontSize: "2.5rem", fontWeight: "bold", marginBottom: 30 }}>
            $0<span style={{ fontSize: "1rem", color: "#666" }}>/month</span>
          </div>
          <ul style={{ listStyle: "none", padding: 0, marginBottom: 30, textAlign: "left" }}>
            <li style={{ padding: "10px 0", borderBottom: "1px solid #f0f0f0" }}>
              ✓ View-only access
            </li>
            <li style={{ padding: "10px 0", borderBottom: "1px solid #f0f0f0" }}>
              ✓ No active escrows
            </li>
            <li style={{ padding: "10px 0" }}>
              ✓ Basic documentation
            </li>
          </ul>
          <button
            disabled
            style={{
              width: "100%",
              padding: "14px 32px",
              fontSize: "1rem",
              backgroundColor: "#e0e0e0",
              color: "#999",
              border: "none",
              borderRadius: 8,
              cursor: "not-allowed",
              fontWeight: "600",
            }}
          >
            Coming Soon
          </button>
        </div>

        {/* Pro Plan */}
        <div
          style={{
            padding: 40,
            border: "2px solid #0070f3",
            borderRadius: 12,
            textAlign: "center",
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: -15,
              left: "50%",
              transform: "translateX(-50%)",
              backgroundColor: "#0070f3",
              color: "white",
              padding: "4px 16px",
              borderRadius: 20,
              fontSize: "0.85rem",
              fontWeight: "600",
            }}
          >
            Popular
          </div>
          <h2 style={{ fontSize: "1.8rem", marginBottom: 10 }}>Pro</h2>
          <div style={{ fontSize: "2.5rem", fontWeight: "bold", marginBottom: 30 }}>
            $49<span style={{ fontSize: "1rem", color: "#666" }}>/month</span>
          </div>
          <ul style={{ listStyle: "none", padding: 0, marginBottom: 30, textAlign: "left" }}>
            <li style={{ padding: "10px 0", borderBottom: "1px solid #f0f0f0" }}>
              ✓ Active escrow creation
            </li>
            <li style={{ padding: "10px 0", borderBottom: "1px solid #f0f0f0" }}>
              ✓ Milestone management
            </li>
            <li style={{ padding: "10px 0", borderBottom: "1px solid #f0f0f0" }}>
              ✓ Standard support
            </li>
            <li style={{ padding: "10px 0" }}>
              ✓ Up to 10 active deals
            </li>
          </ul>
          <button
            disabled
            style={{
              width: "100%",
              padding: "14px 32px",
              fontSize: "1rem",
              backgroundColor: "#e0e0e0",
              color: "#999",
              border: "none",
              borderRadius: 8,
              cursor: "not-allowed",
              fontWeight: "600",
            }}
          >
            Coming Soon
          </button>
        </div>

        {/* Business Plan */}
        <div
          style={{
            padding: 40,
            border: "2px solid #e0e0e0",
            borderRadius: 12,
            textAlign: "center",
          }}
        >
          <h2 style={{ fontSize: "1.8rem", marginBottom: 10 }}>Business</h2>
          <div style={{ fontSize: "2.5rem", fontWeight: "bold", marginBottom: 30 }}>
            $199<span style={{ fontSize: "1rem", color: "#666" }}>/month</span>
          </div>
          <ul style={{ listStyle: "none", padding: 0, marginBottom: 30, textAlign: "left" }}>
            <li style={{ padding: "10px 0", borderBottom: "1px solid #f0f0f0" }}>
              ✓ Advanced workflows
            </li>
            <li style={{ padding: "10px 0", borderBottom: "1px solid #f0f0f0" }}>
              ✓ Priority support
            </li>
            <li style={{ padding: "10px 0", borderBottom: "1px solid #f0f0f0" }}>
              ✓ Custom integrations
            </li>
            <li style={{ padding: "10px 0" }}>
              ✓ Unlimited active deals
            </li>
          </ul>
          <button
            disabled
            style={{
              width: "100%",
              padding: "14px 32px",
              fontSize: "1rem",
              backgroundColor: "#e0e0e0",
              color: "#999",
              border: "none",
              borderRadius: 8,
              cursor: "not-allowed",
              fontWeight: "600",
            }}
          >
            Coming Soon
          </button>
        </div>
      </div>

      {/* Footer Navigation */}
      <footer style={{ marginTop: 80, paddingTop: 40, borderTop: "1px solid #e0e0e0", textAlign: "center" }}>
        <nav style={{ display: "flex", gap: 20, justifyContent: "center", flexWrap: "wrap", marginBottom: 20 }}>
          <a href="/" style={{ color: "#666", textDecoration: "none" }}>Home</a>
          <a href="/about" style={{ color: "#666", textDecoration: "none" }}>About</a>
          <a href="/contact" style={{ color: "#666", textDecoration: "none" }}>Contact</a>
          <a href="/terms" style={{ color: "#666", textDecoration: "none" }}>Terms</a>
          <a href="/privacy" style={{ color: "#666", textDecoration: "none" }}>Privacy</a>
        </nav>
      </footer>
    </main>
  );
}
