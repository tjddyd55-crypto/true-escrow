"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/provider";

interface Template {
  template_key: string;
  label_key: string;
  description_key: string | null;
  defaults?: Record<string, unknown>;
}

interface MyTemplate {
  id: string;
  title: string;
  description: string | null;
}

export default function NewTransactionPage() {
  const router = useRouter();
  const { t, tKey, lang, setLang } = useI18n();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [myTemplates, setMyTemplates] = useState<MyTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    fetchTemplates();
  }, []);

  async function fetchTemplates() {
    try {
      const [templateRes, myTemplateRes] = await Promise.all([
        fetch("/api/escrow/templates"),
        fetch("/api/templates"),
      ]);
      if (templateRes.ok) {
        const data = await templateRes.json();
        setTemplates(data.data || []);
      }
      if (myTemplateRes.ok) {
        const data = await myTemplateRes.json();
        setMyTemplates(data.data || []);
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
        console.log("[Frontend] Redirecting to canonical detail:", transactionId);
        router.push(`/transactions/${transactionId}`);
      } else {
        console.error("[Frontend] Transaction creation failed:", responseData);
        alert(responseData.error || "Failed to create transaction");
      }
    } catch (error) {
      console.error("Failed to create transaction:", error);
      alert("Error creating transaction");
    }
  }

  async function handleCreateFromMyTemplate(templateId: string) {
    try {
      const res = await fetch(`/api/templates/${templateId}/clone-to-trade`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim() || undefined,
          description: description.trim() || undefined,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.ok && json.data?.tradeId) {
        router.push(`/transactions/${json.data.tradeId}`);
        return;
      }
      alert(json.error || "Failed to clone template");
    } catch (e) {
      console.error("Failed to clone my template:", e);
      alert("Failed to clone template");
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

      <div style={{ marginBottom: 40 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h2 style={{ fontSize: "1.3rem", margin: 0 }}>내 템플릿</h2>
          <Link href="/templates" style={{ color: "#0070f3", textDecoration: "none", fontSize: "0.9rem" }}>
            템플릿 관리
          </Link>
        </div>
        {myTemplates.length === 0 ? (
          <p style={{ margin: 0, color: "#666", fontSize: "0.9rem" }}>저장된 템플릿이 없습니다. 빌더에서 "템플릿으로 저장"을 사용하세요.</p>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {myTemplates.map((item) => (
              <div
                key={item.id}
                style={{
                  border: "1px solid #e0e0e0",
                  borderRadius: 8,
                  padding: 14,
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  alignItems: "center",
                }}
              >
                <div>
                  <div style={{ fontWeight: "600" }}>{item.title}</div>
                  {item.description && <div style={{ color: "#666", fontSize: "0.85rem" }}>{item.description}</div>}
                </div>
                <button
                  type="button"
                  onClick={() => handleCreateFromMyTemplate(item.id)}
                  style={{
                    padding: "8px 12px",
                    backgroundColor: "#0ea5e9",
                    color: "white",
                    border: "none",
                    borderRadius: 6,
                    cursor: "pointer",
                    fontWeight: "600",
                  }}
                >
                  이 템플릿으로 시작
                </button>
              </div>
            ))}
          </div>
        )}
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
