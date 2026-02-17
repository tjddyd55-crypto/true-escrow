/**
 * Validate answer value by question type.
 */

export type ValidateResult = { valid: boolean; error?: string };
type ValidateContext = { hasAttachment?: boolean };

function nonEmptyText(v: unknown): boolean {
  return typeof v === "string" && v.trim().length > 0;
}

export function validateAnswerByType(
  questionType: string,
  value: unknown,
  options?: unknown,
  ctx?: ValidateContext
): ValidateResult {
  const parsedOptions = options && typeof options === "object" ? (options as Record<string, unknown>) : {};
  const choiceValues = Array.isArray(parsedOptions.choices)
    ? (parsedOptions.choices as Array<Record<string, unknown>>)
        .map((c) => (typeof c?.value === "string" ? c.value : ""))
        .filter(Boolean)
    : Array.isArray(options)
      ? (options as unknown[]).filter((v): v is string => typeof v === "string")
      : [];

  switch (questionType) {
    case "SHORT_TEXT":
      return nonEmptyText(value)
        ? { valid: true }
        : { valid: false, error: "Short text is required" };
    case "LONG_TEXT":
      return nonEmptyText(value)
        ? { valid: true }
        : { valid: false, error: "Long text is required" };
    case "CHECKBOX":
      if (!Array.isArray(value)) return { valid: false, error: "Checkbox must be an array" };
      if (value.length === 0) return { valid: false, error: "At least one checkbox option is required" };
      if (choiceValues.length && value.some((v) => typeof v !== "string" || !choiceValues.includes(v))) {
        return { valid: false, error: "Invalid checkbox option" };
      }
      return { valid: true };
    case "RADIO":
      if (!nonEmptyText(value)) return { valid: false, error: "Radio selection is required" };
      if (choiceValues.length && !choiceValues.includes((value as string).trim())) {
        return { valid: false, error: "Invalid radio option" };
      }
      return { valid: true };
    case "DROPDOWN":
      if (!nonEmptyText(value)) {
        return { valid: false, error: "Dropdown selection is required" };
      }
      if (choiceValues.length && !choiceValues.includes((value as string).trim())) {
        return { valid: false, error: "Invalid dropdown option" };
      }
      return { valid: true };
    case "DATE": {
      if (typeof value !== "string" || !value.trim()) {
        return { valid: false, error: "Date is required" };
      }
      const iso = /^\d{4}-\d{2}-\d{2}$/;
      if (!iso.test(value)) {
        return { valid: false, error: "Date must be YYYY-MM-DD" };
      }
      const d = new Date(value);
      if (Number.isNaN(d.getTime())) {
        return { valid: false, error: "Invalid date" };
      }
      return { valid: true };
    }
    case "FILE":
      return ctx?.hasAttachment ? { valid: true } : { valid: false, error: "File attachment is required" };
    case "NUMBER": {
      if (value === null || value === undefined || value === "") {
        return { valid: false, error: "Number is required" };
      }
      const n = typeof value === "number" ? value : Number(value);
      if (Number.isNaN(n)) {
        return { valid: false, error: "Invalid number" };
      }
      const min = typeof parsedOptions.min === "number" ? parsedOptions.min : undefined;
      const max = typeof parsedOptions.max === "number" ? parsedOptions.max : undefined;
      if (min != null && n < min) {
        return { valid: false, error: `Number must be >= ${min}` };
      }
      if (max != null && n > max) {
        return { valid: false, error: `Number must be <= ${max}` };
      }
      return { valid: true };
    }
    case "GRID_SINGLE": {
      if (!value || typeof value !== "object") {
        return { valid: false, error: "Grid answer is required" };
      }
      const gridValue = value as Record<string, unknown>;
      const rawRow = gridValue.row;
      const rawColumn = gridValue.column;
      const row = typeof rawRow === "string" ? rawRow.trim() : "";
      const column = typeof rawColumn === "string" ? rawColumn.trim() : "";
      if (!row || !column) {
        return { valid: false, error: "Grid row and column are required" };
      }
      const rows = Array.isArray(parsedOptions.rows)
        ? parsedOptions.rows.filter((v): v is string => typeof v === "string")
        : [];
      const columns = Array.isArray(parsedOptions.columns)
        ? parsedOptions.columns.filter((v): v is string => typeof v === "string")
        : [];
      if (rows.length && !rows.includes(row)) {
        return { valid: false, error: "Invalid grid row" };
      }
      if (columns.length && !columns.includes(column)) {
        return { valid: false, error: "Invalid grid column" };
      }
      return { valid: true };
    }
    default:
      return { valid: true };
  }
}
