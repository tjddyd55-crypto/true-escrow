"use client";

import { useEffect, useMemo, useState } from "react";
import { normalizeQuestionOptions } from "@/lib/block-questions/options";

type BlockQuestion = {
  id: string;
  block_id: string;
  order_index: number;
  type: string;
  label: string | null;
  description: string | null;
  required: boolean;
  allowAttachment?: boolean;
  allow_attachment?: boolean;
  options?: unknown;
};

type AnswerValue = string | string[] | number | { row: string; column: string } | null;

export function BlockQuestionAnswerForm(props: {
  tradeId: string;
  blockId: string;
  actorRole: "BUYER" | "SELLER";
}) {
  const { tradeId, blockId, actorRole } = props;
  const [questions, setQuestions] = useState<BlockQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [attachments, setAttachments] = useState<Record<string, Array<{ id: string; fileName: string; status: string }>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [readiness, setReadiness] = useState<{ ready: boolean; missingRequired: Array<{ questionId: string; reason: string }> } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sortedQuestions = useMemo(
    () => [...questions].sort((a, b) => a.order_index - b.order_index),
    [questions]
  );

  useEffect(() => {
    fetchQuestions();
    fetchReadiness();
  }, [tradeId, blockId]);

  async function fetchQuestions() {
    const res = await fetch(`/api/engine/blocks/${blockId}/questions`, { cache: "no-store" });
    if (!res.ok) return;
    const json = await res.json();
    if (json.ok && Array.isArray(json.data)) setQuestions(json.data);
  }

  async function fetchReadiness() {
    const res = await fetch(`/api/engine/trades/${tradeId}/blocks/${blockId}/readiness`, { cache: "no-store" });
    if (!res.ok) return;
    const json = await res.json();
    if (json.ok && json.data) setReadiness(json.data);
  }

  async function submitAnswers() {
    setSubmitting(true);
    setError(null);
    try {
      const payload = sortedQuestions.map((q) => ({ questionId: q.id, answer: answers[q.id] ?? null }));
      const res = await fetch(`/api/engine/trades/${tradeId}/blocks/${blockId}/answers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actorRole, answers: payload }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) {
        setError(json.error || "Failed to submit answers");
        return;
      }
      await fetchReadiness();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to submit answers");
    } finally {
      setSubmitting(false);
    }
  }

  async function uploadFileMeta(questionId: string, file: File) {
    const res = await fetch(`/api/engine/trades/${tradeId}/blocks/${blockId}/attachments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        uploaderRole: actorRole,
        questionId,
        fileName: file.name,
        mime: file.type || "application/octet-stream",
        size: file.size,
      }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.ok || !json.data?.id) return;
    setAttachments((prev) => ({
      ...prev,
      [questionId]: [
        ...(prev[questionId] ?? []),
        { id: json.data.id, fileName: file.name, status: "PENDING" },
      ],
    }));
    await fetchReadiness();
  }

  function setAnswer(questionId: string, value: AnswerValue) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }

  return (
    <section style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 16, backgroundColor: "white", marginBottom: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h3 style={{ margin: 0, fontSize: "1rem" }}>질문 기반 조건</h3>
        <span
          style={{
            padding: "4px 10px",
            borderRadius: 999,
            fontSize: "0.75rem",
            fontWeight: 700,
            backgroundColor: readiness?.ready ? "#16a34a" : "#b91c1c",
            color: "white",
          }}
        >
          {readiness?.ready ? "READY" : "NOT READY"}
        </span>
      </div>

      {sortedQuestions.length === 0 ? (
        <p style={{ margin: 0, color: "#666", fontSize: "0.9rem" }}>이 블록에는 질문이 없습니다.</p>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {sortedQuestions.map((q) => {
            const opts = normalizeQuestionOptions(q.options);
            return (
              <div key={q.id} style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 12, backgroundColor: "#fafafa" }}>
                <div style={{ fontWeight: 700 }}>
                  {q.label || "Untitled question"} {q.required ? <span style={{ color: "#dc2626" }}>*</span> : null}
                </div>
                {q.description ? <div style={{ fontSize: "0.85rem", color: "#666", marginTop: 4 }}>{q.description}</div> : null}
                <div style={{ marginTop: 8 }}>
                  {q.type === "SHORT_TEXT" && (
                    <input
                      type="text"
                      value={typeof answers[q.id] === "string" ? (answers[q.id] as string) : ""}
                      onChange={(e) => setAnswer(q.id, e.target.value)}
                      style={{ width: "100%", padding: 8, border: "1px solid #d1d5db", borderRadius: 6 }}
                    />
                  )}
                  {q.type === "LONG_TEXT" && (
                    <textarea
                      value={typeof answers[q.id] === "string" ? (answers[q.id] as string) : ""}
                      onChange={(e) => setAnswer(q.id, e.target.value)}
                      rows={4}
                      style={{ width: "100%", padding: 8, border: "1px solid #d1d5db", borderRadius: 6, resize: "vertical" }}
                    />
                  )}

                  {q.type === "NUMBER" && (
                    <input
                      type="number"
                      value={typeof answers[q.id] === "number" || typeof answers[q.id] === "string" ? (answers[q.id] as number | string) : ""}
                      min={opts.number?.min}
                      max={opts.number?.max}
                      onChange={(e) => setAnswer(q.id, e.target.value === "" ? null : Number(e.target.value))}
                      style={{ width: "100%", padding: 8, border: "1px solid #d1d5db", borderRadius: 6 }}
                    />
                  )}

                  {q.type === "DATE" && (
                    <input
                      type="date"
                      value={typeof answers[q.id] === "string" ? (answers[q.id] as string) : ""}
                      onChange={(e) => setAnswer(q.id, e.target.value)}
                      style={{ padding: 8, border: "1px solid #d1d5db", borderRadius: 6 }}
                    />
                  )}

                  {(q.type === "DROPDOWN" || q.type === "RADIO") && (
                    <select
                      value={typeof answers[q.id] === "string" ? (answers[q.id] as string) : ""}
                      onChange={(e) => setAnswer(q.id, e.target.value)}
                      style={{ width: "100%", padding: 8, border: "1px solid #d1d5db", borderRadius: 6 }}
                    >
                      <option value="">선택</option>
                      {(opts.choices ?? []).map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  )}

                  {q.type === "CHECKBOX" && (
                    <div style={{ display: "grid", gap: 6 }}>
                      {(opts.choices ?? []).map((c) => {
                        const selected = Array.isArray(answers[q.id]) ? (answers[q.id] as string[]) : [];
                        const checked = selected.includes(c.value);
                        return (
                          <label key={c.value} style={{ fontSize: "0.9rem", display: "flex", gap: 8 }}>
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => {
                                const next = e.target.checked
                                  ? [...selected, c.value]
                                  : selected.filter((v) => v !== c.value);
                                setAnswer(q.id, next);
                              }}
                            />
                            {c.label}
                          </label>
                        );
                      })}
                    </div>
                  )}

                  {q.type === "GRID_SINGLE" && (
                    <div style={{ display: "flex", gap: 8 }}>
                      <select
                        value={typeof answers[q.id] === "object" && answers[q.id] ? ((answers[q.id] as { row?: string }).row ?? "") : ""}
                        onChange={(e) => {
                          const prev = typeof answers[q.id] === "object" && answers[q.id] ? (answers[q.id] as { row?: string; column?: string }) : {};
                          setAnswer(q.id, { row: e.target.value, column: prev.column ?? "" });
                        }}
                        style={{ flex: 1, padding: 8, border: "1px solid #d1d5db", borderRadius: 6 }}
                      >
                        <option value="">행 선택</option>
                        {(opts.grid?.rows ?? []).map((row) => (
                          <option key={row} value={row}>
                            {row}
                          </option>
                        ))}
                      </select>
                      <select
                        value={typeof answers[q.id] === "object" && answers[q.id] ? ((answers[q.id] as { column?: string }).column ?? "") : ""}
                        onChange={(e) => {
                          const prev = typeof answers[q.id] === "object" && answers[q.id] ? (answers[q.id] as { row?: string; column?: string }) : {};
                          setAnswer(q.id, { row: prev.row ?? "", column: e.target.value });
                        }}
                        style={{ flex: 1, padding: 8, border: "1px solid #d1d5db", borderRadius: 6 }}
                      >
                        <option value="">열 선택</option>
                        {(opts.grid?.columns ?? []).map((column) => (
                          <option key={column} value={column}>
                            {column}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {Boolean(q.allowAttachment || q.allow_attachment || q.type === "FILE") && (
                    <div style={{ display: "grid", gap: 8 }}>
                      <input
                        type="file"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          uploadFileMeta(q.id, file);
                          e.currentTarget.value = "";
                        }}
                      />
                      {(attachments[q.id] ?? []).map((a) => (
                        <div key={a.id} style={{ fontSize: "0.85rem", color: "#555" }}>
                          {a.fileName} · {a.status}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {readiness && !readiness.ready && (
        <div style={{ marginTop: 10, fontSize: "0.85rem", color: "#b91c1c" }}>
          {readiness.missingRequired.map((m) => (
            <div key={m.questionId}>
              - {m.reason}
            </div>
          ))}
        </div>
      )}

      {error ? <div style={{ marginTop: 10, color: "#b91c1c", fontSize: "0.85rem" }}>{error}</div> : null}

      <div style={{ marginTop: 14 }}>
        <button
          type="button"
          onClick={submitAnswers}
          disabled={submitting || sortedQuestions.length === 0}
          style={{
            padding: "8px 14px",
            borderRadius: 6,
            border: "none",
            fontWeight: 700,
            cursor: submitting ? "not-allowed" : "pointer",
            backgroundColor: "#2563eb",
            color: "white",
          }}
        >
          {submitting ? "저장 중..." : "답변 저장"}
        </button>
      </div>
    </section>
  );
}
