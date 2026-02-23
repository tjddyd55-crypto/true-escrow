"use client";

import { useMemo, useState } from "react";

export type BlockQuestion = {
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
  created_at?: string;
};

const QUESTION_TYPES = [
  "LONG_TEXT",
  "FILE_UPLOAD",
] as const;

export function BlockQuestionBuilder(props: {
  blockId: string;
  isDraft: boolean;
  questions: BlockQuestion[];
  onAddQuestion: (blockId: string) => Promise<void>;
  onUpdateQuestion: (questionId: string, patch: Partial<BlockQuestion>) => Promise<void>;
  onDeleteQuestion: (questionId: string, blockId: string) => Promise<void>;
  onReorderQuestions: (blockId: string, orderedQuestionIds: string[]) => Promise<void>;
  onDuplicateQuestion: (blockId: string, source: BlockQuestion) => Promise<void>;
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
                  onChange={(e) =>
                    onUpdateQuestion(q.id, {
                      type: e.target.value,
                      allowAttachment: e.target.value === "FILE_UPLOAD",
                      allow_attachment: e.target.value === "FILE_UPLOAD",
                    })
                  }
                  style={{ padding: 4, border: "1px solid #e0e0e0", borderRadius: 4, fontSize: "0.85rem" }}
                >
                  {QUESTION_TYPES.map((qt) => (
                    <option key={qt} value={qt}>
                      {qt}
                    </option>
                  ))}
                </select>
                <label style={{ fontSize: "0.85rem", display: "flex", alignItems: "center", gap: 4 }}>
                  <input
                    type="checkbox"
                    checked={q.required}
                    onChange={(e) => onUpdateQuestion(q.id, { required: e.target.checked })}
                  />
                  {t.required}
                </label>
              </div>
              <input
                type="text"
                value={q.label ?? ""}
                onChange={(e) => onUpdateQuestion(q.id, { label: e.target.value || "New question" })}
                placeholder={t.questionLabel}
                style={{ width: "100%", padding: 6, marginBottom: 4, border: "1px solid #e0e0e0", borderRadius: 4 }}
              />
              <textarea
                value={q.description ?? ""}
                onChange={(e) => onUpdateQuestion(q.id, { description: e.target.value })}
                placeholder={t.questionDescription}
                rows={2}
                style={{ width: "100%", padding: 6, marginBottom: 4, border: "1px solid #e0e0e0", borderRadius: 4, fontSize: "0.9rem" }}
              />
              {q.type === "LONG_TEXT" ? (
                <textarea
                  disabled
                  rows={3}
                  placeholder="텍스트 입력 미리보기"
                  style={{ width: "100%", padding: 6, border: "1px dashed #cbd5e1", borderRadius: 4, backgroundColor: "#f8fafc" }}
                />
              ) : (
                <div style={{ padding: 8, border: "1px dashed #cbd5e1", borderRadius: 4, color: "#475569", fontSize: "0.85rem" }}>
                  {t.fileUploadPlaceholder}
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
                  style={{
                    padding: "2px 6px",
                    backgroundColor: "#e74c3c",
                    color: "white",
                    border: "none",
                    borderRadius: 4,
                    cursor: "pointer",
                    fontSize: "0.8rem",
                  }}
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
      {list.length === 0 && (
        <p style={{ fontSize: "0.85rem", color: "#666", fontStyle: "italic", margin: 0 }}>{t.noQuestionsYet}</p>
      )}
    </div>
  );
}
