"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewTransactionPage() {
  const router = useRouter();
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const templates = [
    { id: "real-estate", name: "Real Estate" },
    { id: "vehicle", name: "Vehicle" },
    { id: "marketing", name: "Marketing / Freelance" },
    { id: "blank", name: "Blank" },
  ];

  async function handleCreate() {
    if (!selectedTemplate || !title.trim()) {
      alert("Please select a template and enter a title");
      return;
    }

    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";
      const res = await fetch(`${apiBaseUrl}/api/transaction-builder/transactions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": "00000000-0000-0000-0000-000000000001",
        },
        body: JSON.stringify({
          title,
          description,
          initiatorRole: "BUYER",
          buyerId: "00000000-0000-0000-0000-000000000001",
          sellerId: "00000000-0000-0000-0000-000000000002",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        router.push(`/transaction/builder/${data.data.id}`);
      } else {
        alert("Failed to create transaction");
      }
    } catch (error) {
      console.error("Failed to create transaction:", error);
      alert("Error creating transaction");
    }
  }

  return (
    <main style={{ padding: "60px 20px", maxWidth: 800, margin: "0 auto" }}>
      <h1 style={{ fontSize: "3rem", marginBottom: 20, textAlign: "center" }}>
        Design your transaction.
      </h1>

      <div style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: "1.5rem", marginBottom: 20 }}>Select Template</h2>
        <div style={{ display: "grid", gap: 15 }}>
          {templates.map((template) => (
            <label
              key={template.id}
              style={{
                display: "flex",
                alignItems: "center",
                padding: 20,
                border: selectedTemplate === template.id ? "2px solid #0070f3" : "1px solid #e0e0e0",
                borderRadius: 8,
                cursor: "pointer",
                backgroundColor: selectedTemplate === template.id ? "#f0f9ff" : "white",
              }}
            >
              <input
                type="radio"
                name="template"
                value={template.id}
                checked={selectedTemplate === template.id}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                style={{ marginRight: 15 }}
              />
              <span style={{ fontSize: "1.1rem", fontWeight: "600" }}>{template.name}</span>
            </label>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 30 }}>
        <label style={{ display: "block", marginBottom: 8, fontWeight: "600" }}>
          Transaction Title
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter transaction title"
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
          Transaction Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe your transaction"
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
        disabled={!selectedTemplate || !title.trim()}
        style={{
          width: "100%",
          padding: 16,
          backgroundColor: !selectedTemplate || !title.trim() ? "#ccc" : "#0070f3",
          color: "white",
          border: "none",
          borderRadius: 4,
          fontSize: "1.1rem",
          fontWeight: "600",
          cursor: !selectedTemplate || !title.trim() ? "not-allowed" : "pointer",
        }}
      >
        Start Building
      </button>
    </main>
  );
}
