export default function Privacy() {
  return (
    <main style={{ padding: "60px 20px", maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ fontSize: "3rem", fontWeight: "bold", marginBottom: 30 }}>
        Privacy Policy
      </h1>

      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: "1.8rem", marginBottom: 15 }}>1. Information We Collect</h2>
        <p style={{ fontSize: "1.1rem", color: "#555", lineHeight: 1.8, marginBottom: 15 }}>
          We collect only the minimum information required to process payments and operate
          the escrow service. This includes:
        </p>
        <ul style={{ fontSize: "1.1rem", color: "#555", lineHeight: 1.8, paddingLeft: 30 }}>
          <li style={{ marginBottom: 10 }}>
            Account information (name, email address)
          </li>
          <li style={{ marginBottom: 10 }}>
            Transaction details (deal information, milestone data)
          </li>
          <li style={{ marginBottom: 10 }}>
            Payment information (processed through third-party payment providers)
          </li>
          <li>
            Communication records related to transactions and support
          </li>
        </ul>
      </section>

      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: "1.8rem", marginBottom: 15 }}>2. How We Use Your Information</h2>
        <p style={{ fontSize: "1.1rem", color: "#555", lineHeight: 1.8, marginBottom: 15 }}>
          We use collected information to:
        </p>
        <ul style={{ fontSize: "1.1rem", color: "#555", lineHeight: 1.8, paddingLeft: 30 }}>
          <li style={{ marginBottom: 10 }}>
            Process and manage escrow transactions
          </li>
          <li style={{ marginBottom: 10 }}>
            Verify milestone completion and facilitate fund release
          </li>
          <li style={{ marginBottom: 10 }}>
            Provide customer support and resolve disputes
          </li>
          <li>
            Comply with legal and regulatory requirements
          </li>
        </ul>
      </section>

      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: "1.8rem", marginBottom: 15 }}>3. Third-Party Services</h2>
        <p style={{ fontSize: "1.1rem", color: "#555", lineHeight: 1.8, marginBottom: 15 }}>
          <strong>Payments are processed by third-party payment providers.</strong> We do not store or directly process payment card information.
        </p>
        <p style={{ fontSize: "1.1rem", color: "#555", lineHeight: 1.8 }}>
          Personal data is not shared with third parties except for payment processing purposes and as required by law.
          We work with trusted payment processors that comply with industry-standard security and privacy regulations.
        </p>
      </section>

      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: "1.8rem", marginBottom: 15 }}>4. Data Security</h2>
        <p style={{ fontSize: "1.1rem", color: "#555", lineHeight: 1.8 }}>
          We implement appropriate technical and organizational measures to protect your personal
          information against unauthorized access, alteration, disclosure, or destruction.
        </p>
      </section>

      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: "1.8rem", marginBottom: 15 }}>5. Your Rights</h2>
        <p style={{ fontSize: "1.1rem", color: "#555", lineHeight: 1.8, marginBottom: 15 }}>
          You have the right to:
        </p>
        <ul style={{ fontSize: "1.1rem", color: "#555", lineHeight: 1.8, paddingLeft: 30 }}>
          <li style={{ marginBottom: 10 }}>
            Access your personal information
          </li>
          <li style={{ marginBottom: 10 }}>
            Request correction of inaccurate data
          </li>
          <li style={{ marginBottom: 10 }}>
            Request deletion of your data (subject to legal and contractual obligations)
          </li>
          <li>
            Object to processing of your personal information
          </li>
        </ul>
      </section>

      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: "1.8rem", marginBottom: 15 }}>6. Contact Us</h2>
        <p style={{ fontSize: "1.1rem", color: "#555", lineHeight: 1.8 }}>
          For questions about this Privacy Policy or to exercise your rights, please contact us at:{" "}
          <a href="mailto:contact@true-escrow.com" style={{ color: "#0070f3" }}>
            contact@true-escrow.com
          </a>
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
          <a href="/terms" style={{ color: "#666", textDecoration: "none" }}>Terms</a>
        </nav>
      </footer>
    </main>
  );
}
