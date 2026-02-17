export type ChoiceOption = { value: string; label: string };
export type GridSingleOption = { rows: string[]; columns: string[] };
export type NumberOption = { min?: number; max?: number };
export type QuestionOptions = {
  choices?: ChoiceOption[];
  grid?: GridSingleOption;
  number?: NumberOption;
  rows?: string[];
  columns?: string[];
  min?: number;
  max?: number;
};

function toChoice(value: string): ChoiceOption {
  return { value, label: value };
}

export function normalizeQuestionOptions(input: unknown): QuestionOptions {
  if (Array.isArray(input)) {
    const choices = input
      .filter((v): v is string => typeof v === "string")
      .map((v) => v.trim())
      .filter(Boolean)
      .map(toChoice);
    return choices.length ? { choices } : {};
  }
  if (!input || typeof input !== "object") return {};

  const obj = input as Record<string, unknown>;
  const choices = Array.isArray(obj.choices)
    ? obj.choices
        .map((c) => {
          if (!c || typeof c !== "object") return null;
          const choiceObj = c as Record<string, unknown>;
          const rawValue = choiceObj.value;
          const rawLabel = choiceObj.label;
          const value = typeof rawValue === "string" ? rawValue.trim() : "";
          const label = typeof rawLabel === "string" ? rawLabel.trim() : value;
          if (!value) return null;
          return { value, label: label || value };
        })
        .filter((c): c is ChoiceOption => c !== null)
    : [];

  const rows = Array.isArray(obj.rows)
    ? obj.rows.filter((v): v is string => typeof v === "string").map((v) => v.trim()).filter(Boolean)
    : [];
  const columns = Array.isArray(obj.columns)
    ? obj.columns.filter((v): v is string => typeof v === "string").map((v) => v.trim()).filter(Boolean)
    : [];

  let min: number | undefined;
  let max: number | undefined;
  if (obj.number && typeof obj.number === "object") {
    const n = obj.number as Record<string, unknown>;
    min = typeof n.min === "number" ? n.min : undefined;
    max = typeof n.max === "number" ? n.max : undefined;
  } else {
    min = typeof obj.min === "number" ? obj.min : undefined;
    max = typeof obj.max === "number" ? obj.max : undefined;
  }
  const number: NumberOption = { min, max };

  const next: QuestionOptions = {};
  if (choices.length) next.choices = choices;
  if (rows.length || columns.length) next.grid = { rows, columns };
  if (number.min != null || number.max != null) next.number = number;
  return next;
}

export function optionValues(options: unknown): string[] {
  const normalized = normalizeQuestionOptions(options);
  return (normalized.choices ?? []).map((c) => c.value);
}
