import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { I18nProvider } from "@/lib/i18n/provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "true-escrow | Secure Escrow & Milestone Transaction Platform",
  description: "Subscription-based escrow infrastructure for global digital and real-world transactions.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <header
          style={{
            borderBottom: "1px solid #e0e0e0",
            padding: "12px 24px",
            display: "flex",
            alignItems: "center",
            gap: 24,
            backgroundColor: "#fafafa",
          }}
        >
          <Link
            href="/"
            style={{
              fontWeight: 700,
              fontSize: "1.1rem",
              color: "#111",
              textDecoration: "none",
            }}
          >
            true-escrow
          </Link>
          <nav style={{ display: "flex", gap: 20, alignItems: "center" }}>
            <Link
              href="/transaction/new"
              style={{
                color: "#0070f3",
                textDecoration: "none",
                fontWeight: 500,
                fontSize: "0.95rem",
              }}
            >
              Create Transaction
            </Link>
            <Link
              href="/transactions"
              style={{
                color: "#0070f3",
                textDecoration: "none",
                fontWeight: 500,
                fontSize: "0.95rem",
              }}
            >
              Transactions
            </Link>
          </nav>
        </header>
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}
