"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/provider";
import type { TransactionGraph } from "@/lib/transaction-engine/types";
import { buildExecutionPlanDoc } from "@/lib/execution-plan/buildExecutionPlanDoc";
import type { ExecutionPlanDoc } from "@/lib/execution-plan/types";
import { ExecutionPlanTimeline } from "@/components/execution-plan/ExecutionPlanTimeline";

export default function ExecutionPlanPreviewPage() {
  const params = useParams();
  const id = params.id as string;
  const { t, tKey, lang } = useI18n();
  const [doc, setDoc] = useState<ExecutionPlanDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const res = await fetch(`/api/engine/transactions/${id}`, { cache: "no-store" });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError(data.error || "Transaction not found");
          return;
        }
        const json = await res.json();
        if (!json.ok || !json.data) {
          setError("Transaction not found");
          return;
        }
        const graph: TransactionGraph = json.data;
        setDoc(buildExecutionPlanDoc(graph));
      } catch (e: any) {
        setError(e.message || "Failed to load");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const pdfUrl = `/api/engine/transactions/${id}/execution-plan.pdf?lang=${lang === "en" ? "en" : "ko"}`;

  if (loading) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        {t.loading}
      </div>
    );
  }

  if (error || !doc) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <p>{error ?? t.transactionNotFound}</p>
        <Link href="/admin/transactions" style={{ marginTop: "1rem", display: "inline-block" }}>
          ← 목록
        </Link>
      </div>
    );
  }

  const { transaction, summary } = doc;

  return (
    <div style={{ maxWidth: "720px", margin: "0 auto", padding: "24px 16px" }}>
      <div style={{ marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, margin: 0 }}>
            {t.executionPlan?.title ?? "Execution Plan"}
          </h1>
          <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "0.875rem" }}>
            {transaction.title}
          </p>
        </div>
        <a
          href={pdfUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-block",
            padding: "10px 20px",
            background: "#dc2626",
            color: "white",
            borderRadius: "8px",
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          {t.executionPlan?.downloadPdf ?? "Download PDF"}
        </a>
      </div>

      {/* Summary */}
      <div
        style={{
          padding: "16px",
          background: "#f8fafc",
          border: "1px solid #e2e8f0",
          borderRadius: "8px",
          marginBottom: "24px",
        }}
      >
        {transaction.description && (
          <p style={{ margin: "0 0 12px", fontSize: "0.9375rem" }}>{transaction.description}</p>
        )}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "16px 24px", fontSize: "0.875rem" }}>
          {transaction.startDateISO && transaction.endDateISO && (
            <span>
              {t.startDate} ~ {t.endDate}: {transaction.startDateISO} – {transaction.endDateISO}
              {summary.totalDays != null && ` (${summary.totalDays} ${t.executionPlan?.totalDays ?? "days"})`}
            </span>
          )}
          <span>
            {t.executionPlan?.blockCount ?? "Blocks"}: {summary.blockCount}
          </span>
          {transaction.parties && (transaction.parties.buyerId || transaction.parties.sellerId) && (
            <span>
              {t.executionPlan?.parties ?? "Parties"}:{" "}
              {[transaction.parties.buyerId, transaction.parties.sellerId].filter(Boolean).join(", ")}
            </span>
          )}
        </div>
      </div>

      {/* Timeline */}
      <h2 style={{ fontSize: "1.125rem", fontWeight: 600, marginBottom: "16px" }}>
        {t.timeline}
      </h2>
      <ExecutionPlanTimeline doc={doc} tKey={tKey} t={t as any} />

      {/* Disclaimer */}
      <div
        style={{
          marginTop: "32px",
          padding: "16px",
          fontSize: "0.8125rem",
          color: "#64748b",
          borderTop: "1px solid #e2e8f0",
        }}
      >
        {doc.disclaimerLines.map((line, i) => (
          <p key={i} style={{ margin: "4px 0" }}>{line}</p>
        ))}
      </div>

      <div style={{ marginTop: "24px" }}>
        <Link
          href={`/transaction/builder/${id}`}
          style={{ color: "#3b82f6", textDecoration: "none" }}
        >
          ← {t.executionPlan?.preview ?? "Builder"}
        </Link>
      </div>
    </div>
  );
}
