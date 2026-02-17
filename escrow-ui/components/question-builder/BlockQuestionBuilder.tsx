"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { normalizeQuestionOptions, type ChoiceOption } from "@/lib/block-questions/options";
import { createDebouncedDraftSaver } from "@/lib/block-questions/draft";

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
  "SHORT_TEXT",
  "LONG_TEXT",
  "CHECKBOX",
  "DROPDOWN",
  "RADIO",
  "DATE",
  "NUMBER",
  "GRID_SINGLE",
] as const;

function asChoiceList(value: unknown): ChoiceOption[] {
  return normalizeQuestionOptions(value).choices ?? [];
}

function makeChoiceId(): string {
  return `choice_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeChoicesWithIds(choices: ChoiceOption[]): ChoiceOption[] {
  return choices.map((choice) => ({
    id: choice.id ?? makeChoiceId(),
    value: choice.value,
    label: choice.label,
  }));
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
  const [draftQuestions, setDraftQuestions] = useState<BlockQuestion[]>([]);
  const dirtyQuestionIdsRef = useRef<Set<string>>(new Set());
  const pendingPatchRef = useRef<Record<string, Partial<BlockQuestion>>>({});
  const saverRef = useRef(createDebouncedDraftSaver(600));

  useEffect(() => {
    const incoming = [...questions].sort((a, b) => a.order_index - b.order_index);
    setDraftQuestions((prev) => {
      const prevById = new Map(prev.map((q) => [q.id, q]));
      return incoming.map((serverQ) => {
        if (dirtyQuestionIdsRef.current.has(serverQ.id) && prevById.has(serverQ.id)) {
          return prevById.get(serverQ.id) as BlockQuestion;
        }
        return serverQ;
      });
    });
  }, [questions]);

  useEffect(() => {
    return () => {
      saverRef.current.dispose();
    };
  }, []);

  const list = useMemo(() => [...draftQuestions].sort((a, b) => a.order_index - b.order_index), [draftQuestions]);

  function patchLocal(questionId: string, patch: Partial<BlockQuestion>) {
    setDraftQuestions((prev) => prev.map((q) => (q.id === questionId ? { ...q, ...patch } : q)));
  }

  function schedulePersist(questionId: string, patch: Partial<BlockQuestion>, immediate = false) {
    const hasIncomingPatch = Object.keys(patch).length > 0;
    const currentPending = pendingPatchRef.current[questionId] ?? {};
    const nextPending = hasIncomingPatch ? { ...currentPending, ...patch } : currentPending;
    const hasPendingPatch = Object.keys(nextPending).length > 0;
    pendingPatchRef.current[questionId] = nextPending;

    if (hasPendingPatch) {
      dirtyQuestionIdsRef.current.add(questionId);
    }

    const run = async (key: string, seq: number) => {
      const mergedPatch = pendingPatchRef.current[key];
      if (!mergedPatch || Object.keys(mergedPatch).length === 0) {
        if (seq === saverRef.current.latestSeq(key)) {
          dirtyQuestionIdsRef.current.delete(key);
        }
        return;
      }
      pendingPatchRef.current[key] = {};
      await onUpdateQuestion(key, mergedPatch);
      if (seq === saverRef.current.latestSeq(key)) {
        dirtyQuestionIdsRef.current.delete(key);
      }
    };

    if (immediate) saverRef.current.flush(questionId, run);
    else saverRef.current.schedule(questionId, run);
  }

  async function moveQuestion(sourceId: string, targetId: string) {
    if (sourceId === targetId) return;
    const srcIdx = list.findIndex((q) => q.id === sourceId);
    const dstIdx = list.findIndex((q) => q.id === targetId);
    if (srcIdx < 0 || dstIdx < 0) return;
    const next = [...list];
    const [item] = next.splice(srcIdx, 1);
    next.splice(dstIdx, 0, item);
    setDraftQuestions(next);
    await onReorderQuestions(blockId, next.map((q) => q.id));
  }

  function updateChoiceOptions(q: BlockQuestion, nextChoices: ChoiceOption[]) {
    const normalizedChoices = normalizeChoicesWithIds(nextChoices);
    const patch: Partial<BlockQuestion> = { options: { choices: normalizedChoices } };
    patchLocal(q.id, patch);
    schedulePersist(q.id, patch);
  }

  function renderChoiceEditor(q: BlockQuestion) {
    const choices = normalizeChoicesWithIds(asChoiceList(q.options));
    const sectionTitle =
      q.type === "CHECKBOX" ? "Checkbox options" : q.type === "RADIO" ? "Radio options" : "Dropdown options";

    return (
      <div style={{ marginTop: 8 }}>
        <div style={{ fontSize: "0.8rem", color: "#555", marginBottom: 6 }}>{sectionTitle}</div>
        {choices.map((choice, index) => (
          <div key={choice.id} style={{ display: "flex", gap: 6, marginBottom: 6 }}>
            <input
              type="text"
              value={choice.label}
              onChange={(e) => {
                const next = choices.map((c, i) =>
                  i === index
                    ? {
                        id: c.id,
                        value: c.value.trim() ? c.value : e.target.value,
                        label: e.target.value,
                      }
                    : c
                );
                updateChoiceOptions(q, next);
              }}
              onBlur={() => schedulePersist(q.id, {}, true)}
              placeholder={`옵션 ${index + 1}`}
              style={{ flex: 1, padding: 6, border: "1px solid #e0e0e0", borderRadius: 4 }}
            />
            <button
              type="button"
              onClick={() => updateChoiceOptions(q, choices.filter((_, i) => i !== index))}
              style={{ padding: "4px 8px", fontSize: "0.8rem" }}
            >
              -
            </button>
            <button
              type="button"
              disabled={index === 0}
              onClick={() => {
                if (index === 0) return;
                const next = [...choices];
                [next[index - 1], next[index]] = [next[index], next[index - 1]];
                updateChoiceOptions(q, next);
              }}
              style={{ padding: "4px 8px", fontSize: "0.8rem" }}
            >
              ↑
            </button>
            <button
              type="button"
              disabled={index === choices.length - 1}
              onClick={() => {
                if (index === choices.length - 1) return;
                const next = [...choices];
                [next[index], next[index + 1]] = [next[index + 1], next[index]];
                updateChoiceOptions(q, next);
              }}
              style={{ padding: "4px 8px", fontSize: "0.8rem" }}
            >
              ↓
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => {
            const idx = choices.length + 1;
            const next = [...choices, { id: makeChoiceId(), value: `option_${idx}`, label: `옵션 ${idx}` }];
            updateChoiceOptions(q, next);
          }}
          style={{ padding: "4px 8px", fontSize: "0.8rem" }}
        >
          + {t.options}
        </button>
      </div>
    );
  }

  function renderGridListEditor(args: {
    label: string;
    values: string[];
    onChange: (values: string[]) => void;
  }) {
    const { label, values, onChange } = args;
    return (
      <div style={{ display: "grid", gap: 6 }}>
        <div style={{ fontSize: "0.8rem", color: "#555" }}>{label}</div>
        {values.map((value, idx) => (
          <div key={`${label}-${idx}`} style={{ display: "flex", gap: 6 }}>
            <input
              type="text"
              value={value}
              onChange={(e) => onChange(values.map((v, i) => (i === idx ? e.target.value : v)))}
              style={{ flex: 1, padding: 6, border: "1px solid #e0e0e0", borderRadius: 4 }}
            />
            <button type="button" onClick={() => onChange(values.filter((_, i) => i !== idx))} style={{ padding: "4px 8px", fontSize: "0.8rem" }}>
              -
            </button>
            <button
              type="button"
              disabled={idx === 0}
              onClick={() => {
                if (idx === 0) return;
                const next = [...values];
                [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
                onChange(next);
              }}
              style={{ padding: "4px 8px", fontSize: "0.8rem" }}
            >
              ↑
            </button>
            <button
              type="button"
              disabled={idx === values.length - 1}
              onClick={() => {
                if (idx === values.length - 1) return;
                const next = [...values];
                [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
                onChange(next);
              }}
              style={{ padding: "4px 8px", fontSize: "0.8rem" }}
            >
              ↓
            </button>
          </div>
        ))}
        <button type="button" onClick={() => onChange([...values, ""])} style={{ padding: "4px 8px", fontSize: "0.8rem", width: "fit-content" }}>
          + Add
        </button>
      </div>
    );
  }

  function renderGridEditor(q: BlockQuestion) {
    const opts = normalizeQuestionOptions(q.options);
    const rows = opts.grid?.rows ?? [];
    const columns = opts.grid?.columns ?? [];
    return (
      <div style={{ marginTop: 8, display: "grid", gap: 8 }}>
        {renderGridListEditor({
          label: "Rows",
          values: rows,
          onChange: (nextRows) => {
            const patch = { options: { rows: nextRows, columns } };
            patchLocal(q.id, patch);
            schedulePersist(q.id, patch);
          },
        })}
        {renderGridListEditor({
          label: "Columns",
          values: columns,
          onChange: (nextColumns) => {
            const patch = { options: { rows, columns: nextColumns } };
            patchLocal(q.id, patch);
            schedulePersist(q.id, patch);
          },
        })}
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
            const patch = { options: { min, max: opts.number?.max } };
            patchLocal(q.id, patch);
            schedulePersist(q.id, patch);
          }}
          style={{ width: 100, padding: 6, border: "1px solid #e0e0e0", borderRadius: 4 }}
        />
        <input
          type="number"
          value={opts.number?.max ?? ""}
          placeholder="max"
          onChange={(e) => {
            const max = e.target.value === "" ? undefined : Number(e.target.value);
            const patch = { options: { min: opts.number?.min, max } };
            patchLocal(q.id, patch);
            schedulePersist(q.id, patch);
          }}
          style={{ width: 100, padding: 6, border: "1px solid #e0e0e0", borderRadius: 4 }}
        />
      </div>
    );
  }

  function renderTypeSpecificEditor(q: BlockQuestion) {
    switch (q.type) {
      case "SHORT_TEXT":
      case "LONG_TEXT":
        return null;
      case "CHECKBOX":
      case "RADIO":
      case "DROPDOWN":
        return renderChoiceEditor(q);
      case "NUMBER":
        return renderNumberEditor(q);
      case "DATE":
        return <p style={{ margin: "4px 0 0", fontSize: "0.8rem", color: "#666" }}>{t.datePickerNote}</p>;
      case "GRID_SINGLE":
        return renderGridEditor(q);
      default:
        return null;
    }
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
                  onChange={(e) => {
                    const nextType = e.target.value;
                    let nextOptions = q.options ?? {};
                    if (nextType === "CHECKBOX" || nextType === "RADIO" || nextType === "DROPDOWN") {
                      const existing = asChoiceList(q.options);
                      if (existing.length === 0) {
                        nextOptions = {
                          choices: [
                            { id: makeChoiceId(), label: "옵션 1", value: "option_1" },
                            { id: makeChoiceId(), label: "옵션 2", value: "option_2" },
                          ],
                        };
                      }
                    }
                    const patch: Partial<BlockQuestion> = { type: nextType, options: nextOptions };
                    patchLocal(q.id, patch);
                    schedulePersist(q.id, patch, true);
                  }}
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
                    onChange={(e) => {
                      const patch = { required: e.target.checked };
                      patchLocal(q.id, patch);
                      schedulePersist(q.id, patch, true);
                    }}
                  />
                  {t.required}
                </label>
                <label style={{ fontSize: "0.85rem", display: "flex", alignItems: "center", gap: 4 }}>
                  <input
                    type="checkbox"
                    checked={Boolean(q.allowAttachment ?? q.allow_attachment)}
                    onChange={(e) => {
                      const patch = { allowAttachment: e.target.checked, allow_attachment: e.target.checked };
                      patchLocal(q.id, patch);
                      schedulePersist(q.id, patch, true);
                    }}
                  />
                  Allow file/photo upload
                </label>
              </div>
              <input
                type="text"
                value={q.label ?? ""}
                onChange={(e) => {
                  patchLocal(q.id, { label: e.target.value });
                  schedulePersist(q.id, { label: e.target.value || "New question" });
                }}
                onBlur={() => schedulePersist(q.id, {}, true)}
                placeholder={t.questionLabel}
                style={{ width: "100%", padding: 6, marginBottom: 4, border: "1px solid #e0e0e0", borderRadius: 4 }}
              />
              <input
                type="text"
                value={q.description ?? ""}
                onChange={(e) => {
                  patchLocal(q.id, { description: e.target.value });
                  schedulePersist(q.id, { description: e.target.value });
                }}
                onBlur={() => schedulePersist(q.id, {}, true)}
                placeholder={t.questionDescription}
                style={{ width: "100%", padding: 6, marginBottom: 4, border: "1px solid #e0e0e0", borderRadius: 4, fontSize: "0.9rem" }}
              />
              {renderTypeSpecificEditor(q)}
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
