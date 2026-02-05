export default function About() {
  return (
    <main style={{ padding: "60px 20px", maxWidth: 900, margin: "0 auto" }}>
      <section style={{ marginBottom: 60 }}>
        <h1 style={{ fontSize: "3rem", fontWeight: "bold", marginBottom: 30 }}>
          About true-escrow
        </h1>
        <p style={{ fontSize: "1.2rem", color: "#666", lineHeight: 1.8, marginBottom: 30 }}>
          true-escrow is a subscription-based escrow and milestone transaction platform designed
          to provide secure, transparent payment protection for global digital and real-world transactions.
        </p>
      </section>

      <section style={{ marginBottom: 60 }}>
        <h2 style={{ fontSize: "2rem", marginBottom: 20 }}>What problem does true-escrow solve?</h2>
        <p style={{ fontSize: "1.1rem", color: "#555", lineHeight: 1.8, marginBottom: 20 }}>
          Traditional payment methods often leave both buyers and sellers vulnerable. Buyers risk paying
          for incomplete or unsatisfactory work, while sellers face delayed or withheld payments.
        </p>
        <p style={{ fontSize: "1.1rem", color: "#555", lineHeight: 1.8 }}>
          true-escrow solves this by holding funds securely until predefined milestones are completed
          and verified, ensuring fair transactions for all parties involved.
        </p>
      </section>

      <section style={{ marginBottom: 60 }}>
        <h2 style={{ fontSize: "2rem", marginBottom: 20 }}>Why escrow + milestone matters</h2>
        <p style={{ fontSize: "1.1rem", color: "#555", lineHeight: 1.8, marginBottom: 20 }}>
          Milestone-based escrow provides incremental fund release as project phases are completed.
          This approach:
        </p>
        <ul style={{ fontSize: "1.1rem", color: "#555", lineHeight: 1.8, paddingLeft: 30 }}>
          <li style={{ marginBottom: 10 }}>
            Reduces risk for both parties by releasing funds only when milestones are met
          </li>
          <li style={{ marginBottom: 10 }}>
            Provides transparency and accountability throughout the transaction lifecycle
          </li>
          <li style={{ marginBottom: 10 }}>
            Enables dispute resolution with clear evidence and audit trails
          </li>
          <li>
            Supports complex, multi-phase transactions that require structured payment schedules
          </li>
        </ul>
      </section>

      <section style={{ marginBottom: 60 }}>
        <h2 style={{ fontSize: "2rem", marginBottom: 20 }}>
          Built for SaaS, marketplaces, and global deals
        </h2>
        <p style={{ fontSize: "1.1rem", color: "#555", lineHeight: 1.8, marginBottom: 20 }}>
          true-escrow is designed to serve:
        </p>
        <ul style={{ fontSize: "1.1rem", color: "#555", lineHeight: 1.8, paddingLeft: 30 }}>
          <li style={{ marginBottom: 10 }}>
            <strong>SaaS platforms:</strong> Secure subscription and milestone-based service payments
          </li>
          <li style={{ marginBottom: 10 }}>
            <strong>Marketplaces:</strong> Buyer and seller protection for digital and physical goods
          </li>
          <li style={{ marginBottom: 10 }}>
            <strong>Global transactions:</strong> Cross-border deals with transparent fund management
          </li>
          <li>
            <strong>Freelance and contract work:</strong> Milestone-based payment protection for project-based services
          </li>
        </ul>
      </section>

      {/* Footer Navigation */}
      <footer style={{ marginTop: 80, paddingTop: 40, borderTop: "1px solid #e0e0e0", textAlign: "center" }}>
        <nav style={{ display: "flex", gap: 20, justifyContent: "center", flexWrap: "wrap", marginBottom: 20 }}>
          <a href="/" style={{ color: "#666", textDecoration: "none" }}>Home</a>
          <a href="/pricing" style={{ color: "#666", textDecoration: "none" }}>Pricing</a>
          <a href="/contact" style={{ color: "#666", textDecoration: "none" }}>Contact</a>
          <a href="/terms" style={{ color: "#666", textDecoration: "none" }}>Terms</a>
          <a href="/privacy" style={{ color: "#666", textDecoration: "none" }}>Privacy</a>
        </nav>
      </footer>
    </main>
  );
}
