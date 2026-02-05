import FeatureCard from "../components/FeatureCard";

export default function Home() {
  return (
    <main style={{ padding: "60px 20px", maxWidth: 1200, margin: "0 auto" }}>
      {/* Hero Section */}
      <section style={{ textAlign: "center", marginBottom: 80 }}>
        <h1 style={{ fontSize: "3.5rem", fontWeight: "bold", marginBottom: 20, lineHeight: 1.2 }}>
          true-escrow
        </h1>
        <h2 style={{ fontSize: "1.5rem", color: "#666", marginBottom: 40, fontWeight: "normal" }}>
          Secure escrow & milestone-based transaction platform
        </h2>
        <p style={{ fontSize: "1.2rem", color: "#555", maxWidth: 700, margin: "0 auto 30px", lineHeight: 1.6 }}>
          Subscription-based escrow & milestone transaction platform.
        </p>
        <p style={{ fontSize: "1rem", color: "#666", maxWidth: 700, margin: "0 auto 50px", lineHeight: 1.6 }}>
          Payments are processed by third-party payment providers.
        </p>

        {/* CTA Buttons */}
        <div style={{ display: "flex", gap: 20, justifyContent: "center", flexWrap: "wrap" }}>
          <a href="/pricing">
            <button
              style={{
                padding: "14px 32px",
                fontSize: "1.1rem",
                backgroundColor: "#0070f3",
                color: "white",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
                fontWeight: "600",
              }}
            >
              View Pricing
            </button>
          </a>
          <a href="/contact">
            <button
              style={{
                padding: "14px 32px",
                fontSize: "1.1rem",
                backgroundColor: "transparent",
                color: "#0070f3",
                border: "2px solid #0070f3",
                borderRadius: 8,
                cursor: "pointer",
                fontWeight: "600",
              }}
            >
              Contact Us
            </button>
          </a>
        </div>
      </section>

      {/* Features Section */}
      <section style={{ marginTop: 100 }}>
        <h2 style={{ fontSize: "2rem", textAlign: "center", marginBottom: 50 }}>
          Why true-escrow?
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 40,
            marginTop: 40,
          }}
        >
          <FeatureCard
            href="/features/escrow-protection"
            icon="🔒"
            title="Escrow-based payment protection"
            description="Funds are securely held in escrow until transaction milestones are completed and verified."
          />
          <FeatureCard
            href="/features/milestone-release"
            icon="📋"
            title="Milestone-driven fund release"
            description="Release funds incrementally as project milestones are met, ensuring fair and transparent transactions."
          />
          <FeatureCard
            href="/features/global-transactions"
            icon="🌍"
            title="Built for global transactions"
            description="Designed to support cross-border deals, digital services, and real-world asset transactions worldwide."
          />
        </div>
      </section>

      {/* Footer Navigation */}
      <footer style={{ marginTop: 100, paddingTop: 40, borderTop: "1px solid #e0e0e0", textAlign: "center" }}>
        <nav style={{ display: "flex", gap: 20, justifyContent: "center", flexWrap: "wrap", marginBottom: 20 }}>
          <a href="/about" style={{ color: "#666", textDecoration: "none" }}>About</a>
          <a href="/pricing" style={{ color: "#666", textDecoration: "none" }}>Pricing</a>
          <a href="/contact" style={{ color: "#666", textDecoration: "none" }}>Contact</a>
          <a href="/terms" style={{ color: "#666", textDecoration: "none" }}>Terms</a>
          <a href="/privacy" style={{ color: "#666", textDecoration: "none" }}>Privacy</a>
        </nav>
        <p style={{ color: "#999", fontSize: "0.9rem" }}>
          © 2025 true-escrow. All rights reserved.
        </p>
      </footer>
    </main>
  );
}
