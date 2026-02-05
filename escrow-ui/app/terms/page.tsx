export default function Terms() {
  return (
    <main style={{ padding: "60px 20px", maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ fontSize: "3rem", fontWeight: "bold", marginBottom: 30 }}>
        Terms of Service
      </h1>

      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: "1.8rem", marginBottom: 15 }}>1. Acceptance of Terms</h2>
        <p style={{ fontSize: "1.1rem", color: "#555", lineHeight: 1.8 }}>
          By accessing and using true-escrow, you accept and agree to be bound by the terms
          and provision of this agreement. If you do not agree to these Terms of Service,
          please do not use our service.
        </p>
      </section>

      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: "1.8rem", marginBottom: 15 }}>2. Service Description</h2>
        <p style={{ fontSize: "1.1rem", color: "#555", lineHeight: 1.8, marginBottom: 15 }}>
          true-escrow provides a subscription-based escrow and milestone transaction platform.
          Funds are held in escrow and released only according to milestone completion and
          verification by all parties involved.
        </p>
        <p style={{ fontSize: "1.1rem", color: "#555", lineHeight: 1.8 }}>
          <strong>Payments are handled by third-party payment providers.</strong> true-escrow
          does not directly process payments but facilitates secure escrow transactions through
          integrated payment processing services.
        </p>
      </section>

      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: "1.8rem", marginBottom: 15 }}>3. User Responsibilities</h2>
        <p style={{ fontSize: "1.1rem", color: "#555", lineHeight: 1.8, marginBottom: 15 }}>
          Users are responsible for:
        </p>
        <ul style={{ fontSize: "1.1rem", color: "#555", lineHeight: 1.8, paddingLeft: 30 }}>
          <li style={{ marginBottom: 10 }}>
            Providing accurate information for all transactions
          </li>
          <li style={{ marginBottom: 10 }}>
            Completing milestones as agreed upon in transaction terms
          </li>
          <li style={{ marginBottom: 10 }}>
            Verifying milestone completion before requesting fund release
          </li>
          <li>
            Complying with all applicable laws and regulations
          </li>
        </ul>
      </section>

      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: "1.8rem", marginBottom: 15 }}>4. Escrow Process</h2>
        <p style={{ fontSize: "1.1rem", color: "#555", lineHeight: 1.8 }}>
          Funds deposited into escrow are held securely until:
        </p>
        <ul style={{ fontSize: "1.1rem", color: "#555", lineHeight: 1.8, paddingLeft: 30, marginTop: 15 }}>
          <li style={{ marginBottom: 10 }}>
            All parties confirm milestone completion, or
          </li>
          <li style={{ marginBottom: 10 }}>
            A dispute is resolved through our dispute resolution process, or
          </li>
          <li>
            A refund is authorized according to the transaction terms
          </li>
        </ul>
      </section>

      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: "1.8rem", marginBottom: 15 }}>5. Limitation of Liability</h2>
        <p style={{ fontSize: "1.1rem", color: "#555", lineHeight: 1.8 }}>
          true-escrow acts as an intermediary platform. We are not liable for disputes between
          buyers and sellers, or for any losses arising from transactions conducted through
          our platform, except as required by applicable law.
        </p>
      </section>

      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: "1.8rem", marginBottom: 15 }}>6. Changes to Terms</h2>
        <p style={{ fontSize: "1.1rem", color: "#555", lineHeight: 1.8 }}>
          We reserve the right to modify these terms at any time. Continued use of the service
          after changes constitutes acceptance of the modified terms.
        </p>
      </section>

      <section style={{ marginBottom: 40 }}>
        <p style={{ fontSize: "1rem", color: "#999", fontStyle: "italic" }}>
          Last updated: January 2025
        </p>
      </section>

      {/* Footer Navigation */}
      <footer style={{ marginTop: 80, paddingTop: 40, borderTop: "1px solid #e0e0e0", textAlign: "center" }}>
        <nav style={{ display: "flex", gap: 20, justifyContent: "center", flexWrap: "wrap", marginBottom: 20 }}>
          <a href="/" style={{ color: "#666", textDecoration: "none" }}>Home</a>
          <a href="/about" style={{ color: "#666", textDecoration: "none" }}>About</a>
          <a href="/pricing" style={{ color: "#666", textDecoration: "none" }}>Pricing</a>
          <a href="/contact" style={{ color: "#666", textDecoration: "none" }}>Contact</a>
          <a href="/privacy" style={{ color: "#666", textDecoration: "none" }}>Privacy</a>
        </nav>
      </footer>
    </main>
  );
}
