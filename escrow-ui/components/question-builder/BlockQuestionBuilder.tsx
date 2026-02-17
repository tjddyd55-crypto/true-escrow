"use client";

import { useMemo, useState } from "react";
import { normalizeQuestionOptions, type ChoiceOption } from "@/lib/block-questions/options";

export type BlockQuestion = {
  id: string;
  block_id: string;
  order_index: number;
  type: string;
  label: string | null;
  description: string | null;
  required: boolean;
  options?: unknown;
  created_at?: string;
};

const QUESTION_TYPES = [
  "SHORT_TEXT",
  "LONG_TEXT",
  "CHECKBOX",
  "DROPDOWN",
  "RADIO",
  "DATE",
  "FILE",
  "NUMBER",
  "GRID_SINGLE",
] as const;

function asChoiceList(value: unknown): ChoiceOption[] {
  return normalizeQuestionOptions(value).choices ?? [];
}

export function BlockQuestionBuilder(props: {
  blockId: string;
  isDraft: boolean;
  questions: BlockQuestion[];
  onAddQuestion: (blockId: string) => Promise<void>;
  onUpdateQuestion: (questionId: string, patch: Partial<BlockQuestion>) => Promise<void>;
  onDeleteQuestion: (questionId: string, blockId: string) => Promise<void>;
  onReorderQuestions: (blockId: string, orderedQuestionIds: string[]) => Promise<void>;
  onDuplicateQuestion: (blockId: string, source: BlockQuestion) => Promise<void>;
  attachmentsByQuestionId: Record<string, Array<{ id: string; fileName: string; status: string }>>;
  onCreateAttachmentMetadata: (args: { blockId: string; questionId: string; file: File }) => Promise<void>;
  t: {
    blockQuestions: string;
    addQuestion: string;
    required: string;
    questionLabel: string;
    questionDescription: string;
    options: string;
    delete: string;
    noQuestionsYet: string;
    datePickerNote: string;
    fileUploadPlaceholder: string;
  };
}) {
  const { blockId, isDraft, questions, onAddQuestion, onUpdateQuestion, onDeleteQuestion, onReorderQuestions, onDuplicateQuestion, t } =
    props;
  const [draggingQuestionId, setDraggingQuestionId] = useState<string | null>(null);
  const [selectedFileByQuestionId, setSelectedFileByQuestionId] = useState<Record<string, File | null>>({});

  const list = useMemo(() => [...questions].sort((a, b) => a.order_index - b.order_index), [questions]);

  async function moveQuestion(sourceId: string, targetId: string) {
    if (sourceId === targetId) return;
    const srcIdx = list.findIndex((q) => q.id === sourceId);
    const dstIdx = list.findIndex((q) => q.id === targetId);
    if (srcIdx < 0 || dstIdx < 0) return;
    const next = [...list];
    const [item] = next.splice(srcIdx, 1);
    next.splice(dstIdx, 0, item);
    await onReorderQuestions(blockId, next.map((q) => q.id));
  }

  function renderChoiceEditor(q: BlockQuestion) {
    const choices = asChoiceList(q.options);
    return (
      <div style={{ marginTop: 8 }}>
        <div style={{ fontSize: "0.8rem", color: "#555", marginBottom: 6 }}>{t.options}</div>
        {choices.map((choice, index) => (
          <div key={`${q.id}-choice-${index}`} style={{ display: "flex", gap: 6, marginBottom: 6 }}>
            <input
              type="text"
              value={choice.label}
              onChange={(e) => {
                const next = choices.map((c, i) => (i === index ? { value: c.value || e.target.value, label: e.target.value } : c));
                onUpdateQuestion(q.id, { options: { choices: next } });
              }}
              placeholder={`Choice ${index + 1}`}
              style={{ flex: 1, padding: 6, border: "1px solid #e0e0e0", borderRadius: 4 }}
            />
            <button
              type="button"
              onClick={() => onUpdateQuestion(q.id, { options: { choices: choices.filter((_, i) => i !== index) } })}
              style={{ padding: "4px 8px", fontSize: "0.8rem" }}
            >
              -
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => {
            const next = [...choices, { value: `choice_${choices.length + 1}`, label: `Option ${choices.length + 1}` }];
            onUpdateQuestion(q.id, { options: { choices: next } });
          }}
          style={{ padding: "4px 8px", fontSize: "0.8rem" }}
        >
          + {t.options}
        </button>
      </div>
    );
  }

  function renderGridEditor(q: BlockQuestion) {
    const opts = normalizeQuestionOptions(q.options);
    const rows = opts.grid?.rows ?? [];
    const columns = opts.grid?.columns ?? [];
    return (
      <div style={{ marginTop: 8, display: "grid", gap: 6 }}>
        <label style={{ fontSize: "0.8rem", color: "#555" }}>
          Rows
          <input
            type="text"
            value={rows.join(", ")}
            onChange={(e) =>
              onUpdateQuestion(q.id, {
                options: {
                  rows: e.target.value
                    .split(",")
                    .map((v) => v.trim())
                    .filter(Boolean),
                  columns,
                },
              })
            }
            placeholder="품질, 속도, 친절도"
            style={{ width: "100%", padding: 6, marginTop: 4, border: "1px solid #e0e0e0", borderRadius: 4 }}
          />
        </label>
        <label style={{ fontSize: "0.8rem", color: "#555" }}>
          Columns
          <input
            type="text"
            value={columns.join(", ")}
            onChange={(e) =>
              onUpdateQuestion(q.id, {
                options: {
                  rows,
                  columns: e.target.value
                    .split(",")
                    .map((v) => v.trim())
                    .filter(Boolean),
                },
              })
            }
            placeholder="좋음, 보통, 나쁨"
            style={{ width: "100%", padding: 6, marginTop: 4, border: "1px solid #e0e0e0", borderRadius: 4 }}
          />
        </label>
      </div>
    );
  }

  function renderNumberEditor(q: BlockQuestion) {
    const opts = normalizeQuestionOptions(q.options);
    return (
      <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
        <input
          type="number"
          value={opts.number?.min ?? ""}
          placeholder="min"
          onChange={(e) => {
            const min = e.target.value === "" ? undefined : Number(e.target.value);
            onUpdateQuestion(q.id, { options: { min, max: opts.number?.max } });
          }}
          style={{ width: 100, padding: 6, border: "1px solid #e0e0e0", borderRadius: 4 }}
        />
        <input
          type="number"
          value={opts.number?.max ?? ""}
          placeholder="max"
          onChange={(e) => {
            const max = e.target.value === "" ? undefined : Number(e.target.value);
            onUpdateQuestion(q.id, { options: { min: opts.number?.min, max } });
          }}
          style={{ width: 100, padding: 6, border: "1px solid #e0e0e0", borderRadius: 4 }}
        />
      </div>
    );
  }

  return (
    <div style={{ marginBottom: 15, padding: 10, backgroundColor: "#f0fdf4", borderRadius: 4 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <h4 style={{ margin: 0, fontSize: "1rem" }}>{t.blockQuestions}</h4>
        {isDraft && (
          <button
            type="button"
            onClick={() => onAddQuestion(blockId)}
            style={{
              padding: "4px 8px",
              backgroundColor: "#16a34a",
              color: "white",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
              fontSize: "0.85rem",
            }}
          >
            {t.addQuestion}
          </button>
        )}
      </div>
      {list.map((q) => (
        <div
          key={q.id}
          draggable={isDraft}
          onDragStart={() => setDraggingQuestionId(q.id)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={async () => {
            if (!draggingQuestionId) return;
            await moveQuestion(draggingQuestionId, q.id);
            setDraggingQuestionId(null);
          }}
          style={{ padding: 10, marginBottom: 8, border: "1px solid #e0e0e0", borderRadius: 4, backgroundColor: "white" }}
        >
          {isDraft ? (
            <>
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6, flexWrap: "wrap" }}>
                <span style={{ cursor: "grab", color: "#666" }} title="Drag to reorder">
                  :::
                </span>
                <select
                  value={q.type}
                  onChange={(e) => onUpdateQuestion(q.id, { type: e.target.value })}
                  style={{ padding: 4, border: "1px solid #e0e0e0", borderRadius: 4, fontSize: "0.85rem" }}
                >
                  {QUESTION_TYPES.map((qt) => (
                    <option key={qt} value={qt}>
                      {qt}
                    </option>
                  ))}
                </select>
                <label style={{ fontSize: "0.85rem", display: "flex", alignItems: "center", gap: 4 }}>
                  <input type="checkbox" checked={q.required} onChange={(e) => onUpdateQuestion(q.id, { required: e.target.checked })} />
                  {t.required}
                </label>
              </div>
              <input
                type="text"
                value={q.label ?? ""}
                onChange={(e) => onUpdateQuestion(q.id, { label: e.target.value || "Untitled question" })}
                placeholder={t.questionLabel}
                style={{ width: "100%", padding: 6, marginBottom: 4, border: "1px solid #e0e0e0", borderRadius: 4 }}
              />
              <input
                type="text"
                value={q.description ?? ""}
                onChange={(e) => onUpdateQuestion(q.id, { description: e.target.value })}
                placeholder={t.questionDescription}
                style={{ width: "100%", padding: 6, marginBottom: 4, border: "1px solid #e0e0e0", borderRadius: 4, fontSize: "0.9rem" }}
              />
              {(q.type === "CHECKBOX" || q.type === "DROPDOWN" || q.type === "RADIO") && renderChoiceEditor(q)}
              {q.type === "GRID_SINGLE" && renderGridEditor(q)}
              {q.type === "NUMBER" && renderNumberEditor(q)}
              {q.type === "DATE" && <p style={{ margin: "4px 0 0", fontSize: "0.8rem", color: "#666" }}>{t.datePickerNote}</p>}
              {q.type === "FILE" && (
                <div style={{ marginTop: 8 }}>
                  <p style={{ margin: "4px 0 6px", fontSize: "0.8rem", color: "#666" }}>{t.fileUploadPlaceholder}</p>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <input
                      type="file"
                      onChange={(e) =>
                        setSelectedFileByQuestionId((prev) => ({
                          ...prev,
                          [q.id]: e.target.files?.[0] ?? null,
                        }))
                      }
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        const file = selectedFileByQuestionId[q.id];
                        if (!file) return;
                        await props.onCreateAttachmentMetadata({ blockId, questionId: q.id, file });
                        setSelectedFileByQuestionId((prev) => ({ ...prev, [q.id]: null }));
                      }}
                      style={{ padding: "4px 8px", fontSize: "0.8rem" }}
                    >
                      Upload metadata
                    </button>
                  </div>
                  {(props.attachmentsByQuestionId[q.id] ?? []).length > 0 && (
                    <div style={{ marginTop: 8, display: "grid", gap: 4 }}>
                      {(props.attachmentsByQuestionId[q.id] ?? []).map((a) => (
                        <div key={a.id} style={{ fontSize: "0.8rem", color: "#555" }}>
                          {a.fileName} · {a.status}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => onDuplicateQuestion(blockId, q)}
                  style={{ padding: "2px 6px", fontSize: "0.8rem" }}
                >
                  Duplicate
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteQuestion(q.id, blockId)}
                  style={{ padding: "2px 6px", backgroundColor: "#e74c3c", color: "white", border: "none", borderRadius: 4, cursor: "pointer", fontSize: "0.8rem" }}
                >
                  {t.delete}
                </button>
              </div>
            </>
          ) : (
            <div>
              <div style={{ fontWeight: "600" }}>{q.label || q.type}</div>
              {q.description && <div style={{ fontSize: "0.85rem", color: "#666" }}>{q.description}</div>}
              <span style={{ fontSize: "0.75rem", color: "#999" }}>
                {q.type}
                {q.required ? " · " + t.required : ""}
              </span>
            </div>
          )}
        </div>
      ))}
      {list.length === 0 && <p style={{ fontSize: "0.85rem", color: "#666", fontStyle: "italic", margin: 0 }}>{t.noQuestionsYet}</p>}
    </div>
  );
}
