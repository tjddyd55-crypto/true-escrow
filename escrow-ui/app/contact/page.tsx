export default function Contact() {
  return (
    <main style={{ padding: "60px 20px", maxWidth: 700, margin: "0 auto" }}>
      <section style={{ textAlign: "center", marginBottom: 60 }}>
        <h1 style={{ fontSize: "3rem", fontWeight: "bold", marginBottom: 20 }}>
          Contact Us
        </h1>
        <p style={{ fontSize: "1.2rem", color: "#666", marginBottom: 40 }}>
          Get in touch with our team
        </p>
      </section>

      <section style={{ marginBottom: 60 }}>
        <div
          style={{
            padding: 40,
            border: "1px solid #e0e0e0",
            borderRadius: 12,
            backgroundColor: "#fafafa",
          }}
        >
          <h2 style={{ fontSize: "1.5rem", marginBottom: 20 }}>Contact Email</h2>
          <p style={{ fontSize: "1.1rem", marginBottom: 10 }}>
            <strong>Email:</strong>{" "}
            <a
              href="mailto:contact@true-escrow.com"
              style={{ color: "#0070f3", textDecoration: "none" }}
            >
              contact@true-escrow.com
            </a>
          </p>
          <p style={{ fontSize: "1rem", color: "#666", marginTop: 20 }}>
            We typically respond within 24-48 hours.
          </p>
        </div>
      </section>

      <section style={{ marginBottom: 60 }}>
        <h2 style={{ fontSize: "1.5rem", marginBottom: 20 }}>Send us a message</h2>
        <form
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 20,
          }}
        >
          <div>
            <label
              htmlFor="name"
              style={{ display: "block", marginBottom: 8, fontWeight: "600" }}
            >
              Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              style={{
                width: "100%",
                padding: "12px",
                border: "1px solid #e0e0e0",
                borderRadius: 6,
                fontSize: "1rem",
              }}
              placeholder="Your name"
            />
          </div>
          <div>
            <label
              htmlFor="email"
              style={{ display: "block", marginBottom: 8, fontWeight: "600" }}
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              style={{
                width: "100%",
                padding: "12px",
                border: "1px solid #e0e0e0",
                borderRadius: 6,
                fontSize: "1rem",
              }}
              placeholder="your@email.com"
            />
          </div>
          <div>
            <label
              htmlFor="message"
              style={{ display: "block", marginBottom: 8, fontWeight: "600" }}
            >
              Message
            </label>
            <textarea
              id="message"
              name="message"
              rows={6}
              style={{
                width: "100%",
                padding: "12px",
                border: "1px solid #e0e0e0",
                borderRadius: 6,
                fontSize: "1rem",
                fontFamily: "inherit",
              }}
              placeholder="Your message..."
            />
          </div>
          <button
            type="button"
            disabled
            style={{
              padding: "14px 32px",
              fontSize: "1rem",
              backgroundColor: "#e0e0e0",
              color: "#999",
              border: "none",
              borderRadius: 8,
              cursor: "not-allowed",
              fontWeight: "600",
              alignSelf: "flex-start",
            }}
          >
            Send Message (Coming Soon)
          </button>
          <p style={{ fontSize: "0.9rem", color: "#999", marginTop: -10 }}>
            Form submission is currently disabled. Please use the email above to contact us.
          </p>
        </form>
      </section>

      {/* Footer Navigation */}
      <footer style={{ marginTop: 80, paddingTop: 40, borderTop: "1px solid #e0e0e0", textAlign: "center" }}>
        <nav style={{ display: "flex", gap: 20, justifyContent: "center", flexWrap: "wrap", marginBottom: 20 }}>
          <a href="/" style={{ color: "#666", textDecoration: "none" }}>Home</a>
          <a href="/about" style={{ color: "#666", textDecoration: "none" }}>About</a>
          <a href="/pricing" style={{ color: "#666", textDecoration: "none" }}>Pricing</a>
          <a href="/terms" style={{ color: "#666", textDecoration: "none" }}>Terms</a>
          <a href="/privacy" style={{ color: "#666", textDecoration: "none" }}>Privacy</a>
        </nav>
      </footer>
    </main>
  );
}
