"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/provider";

interface Template {
  template_key: string;
  label_key: string;
  description_key: string | null;
  defaults?: Record<string, unknown>;
}

export default function NewTransactionPage() {
  const router = useRouter();
  const { t, tKey, lang, setLang } = useI18n();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    fetchTemplates();
  }, []);

  async function fetchTemplates() {
    try {
      const res = await fetch("/api/escrow/templates");
      if (res.ok) {
        const data = await res.json();
        setTemplates(data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch templates:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    if (!title.trim()) {
      alert("Please enter a transaction title");
      return;
    }

    try {
      const payload: any = {
        title,
        description,
        initiatorId: "00000000-0000-0000-0000-000000000001",
        initiatorRole: "BUYER",
        buyerId: "00000000-0000-0000-0000-000000000001",
        sellerId: "00000000-0000-0000-0000-000000000002",
      };

      if (selectedTemplate && selectedTemplate !== "blank") {
        payload.template_key = selectedTemplate;
      }

      const res = await fetch("/api/engine/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const responseData = await res.json();
      console.log("[Frontend] Transaction creation response:", responseData);

      if (res.ok && responseData.ok && responseData.data && responseData.data.id) {
        const transactionId = responseData.data.id;
        console.log("[Frontend] Redirecting to builder:", transactionId);
        router.push(`/transaction/builder/${transactionId}`);
      } else {
        console.error("[Frontend] Transaction creation failed:", responseData);
        alert(responseData.error || "Failed to create transaction");
      }
    } catch (error) {
      console.error("Failed to create transaction:", error);
      alert("Error creating transaction");
    }
  }

  if (loading) {
    return <div style={{ padding: 40 }}>{t.loading}</div>;
  }

  return (
    <main style={{ padding: "60px 20px", maxWidth: 800, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1 style={{ fontSize: "3rem", marginBottom: 0, textAlign: "left", flex: 1 }}>
          {t.slogan}
        </h1>
        <div style={{ display: "flex", gap: 12, alignItems: "center", fontSize: "0.9rem" }}>
          <span
            onClick={() => setLang("en")}
            style={{
              cursor: "pointer",
              color: lang === "en" ? "#0070f3" : "#666",
              fontWeight: lang === "en" ? "600" : "400",
              textDecoration: lang === "en" ? "underline" : "none",
            }}
          >
            EN
          </span>
          <span style={{ color: "#ccc" }}>|</span>
          <span
            onClick={() => setLang("ko")}
            style={{
              cursor: "pointer",
              color: lang === "ko" ? "#0070f3" : "#666",
              fontWeight: lang === "ko" ? "600" : "400",
              textDecoration: lang === "ko" ? "underline" : "none",
            }}
          >
            KO
          </span>
        </div>
      </div>

      <div style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: "1.5rem", marginBottom: 20 }}>{t.selectTemplate}</h2>
        <div style={{ display: "grid", gap: 15 }}>
          <label
            style={{
              display: "flex",
              alignItems: "center",
              padding: 20,
              border: selectedTemplate === "blank" ? "2px solid #0070f3" : "1px solid #e0e0e0",
              borderRadius: 8,
              cursor: "pointer",
              backgroundColor: selectedTemplate === "blank" ? "#f0f9ff" : "white",
            }}
          >
            <input
              type="radio"
              name="template"
              value="blank"
              checked={selectedTemplate === "blank"}
              onChange={(e) => setSelectedTemplate(e.target.value)}
              style={{ marginRight: 15 }}
            />
            <span style={{ fontSize: "1.1rem", fontWeight: "600" }}>Blank</span>
          </label>
          {templates.map((template) => (
            <label
              key={template.template_key}
              style={{
                display: "flex",
                alignItems: "center",
                padding: 20,
                border: selectedTemplate === template.template_key ? "2px solid #0070f3" : "1px solid #e0e0e0",
                borderRadius: 8,
                cursor: "pointer",
                backgroundColor: selectedTemplate === template.template_key ? "#f0f9ff" : "white",
              }}
            >
              <input
                type="radio"
                name="template"
                value={template.template_key}
                checked={selectedTemplate === template.template_key}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                style={{ marginRight: 15 }}
              />
              <div>
                <div style={{ fontSize: "1.1rem", fontWeight: "600", marginBottom: 4 }}>
                  {tKey(template.label_key)}
                </div>
                {template.description_key && (
                  <div style={{ fontSize: "0.9rem", color: "#666" }}>
                    {tKey(template.description_key)}
                  </div>
                )}
              </div>
            </label>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 30 }}>
        <label style={{ display: "block", marginBottom: 8, fontWeight: "600" }}>
          {t.transactionTitle} *
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t.transactionTitle}
          style={{
            width: "100%",
            padding: 12,
            border: "1px solid #e0e0e0",
            borderRadius: 4,
            fontSize: "1rem",
          }}
        />
      </div>

      <div style={{ marginBottom: 30 }}>
        <label style={{ display: "block", marginBottom: 8, fontWeight: "600" }}>
          {t.transactionDescription}
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t.transactionDescription}
          rows={4}
          style={{
            width: "100%",
            padding: 12,
            border: "1px solid #e0e0e0",
            borderRadius: 4,
            fontSize: "1rem",
            fontFamily: "inherit",
          }}
        />
      </div>

      <button
        onClick={handleCreate}
        disabled={!title.trim()}
        style={{
          width: "100%",
          padding: 16,
          backgroundColor: !title.trim() ? "#ccc" : "#0070f3",
          color: "white",
          border: "none",
          borderRadius: 4,
          fontSize: "1.1rem",
          fontWeight: "600",
          cursor: !title.trim() ? "not-allowed" : "pointer",
        }}
      >
        {t.startBuilding}
      </button>
    </main>
  );
}
