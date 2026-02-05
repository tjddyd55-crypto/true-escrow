"use client";

interface FeatureCardProps {
  href: string;
  icon: string;
  title: string;
  description: string;
}

export default function FeatureCard({ href, icon, title, description }: FeatureCardProps) {
  return (
    <a
      href={href}
      style={{
        textDecoration: "none",
        color: "inherit",
        display: "block",
        padding: 30,
        border: "1px solid #e0e0e0",
        borderRadius: 8,
        transition: "all 0.2s",
        cursor: "pointer",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "#0070f3";
        e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 112, 243, 0.1)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "#e0e0e0";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <h3 style={{ fontSize: "1.3rem", marginBottom: 15 }}>{icon} {title}</h3>
      <p style={{ color: "#666", lineHeight: 1.6 }}>
        {description}
      </p>
      <p style={{ color: "#0070f3", fontSize: "0.9rem", marginTop: 15, fontWeight: "600" }}>
        Learn more →
      </p>
    </a>
  );
}
