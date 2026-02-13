/**
 * Validate answer value by question type (SHORT_TEXT, LONG_TEXT, CHECKBOX, DROPDOWN, DATE, FILE, NUMBER).
 */

export type ValidateResult = { valid: boolean; error?: string };

export function validateAnswerByType(
  questionType: string,
  value: unknown,
  options?: string[]
): ValidateResult {
  switch (questionType) {
    case "SHORT_TEXT":
      return typeof value === "string" && value.trim().length > 0
        ? { valid: true }
        : { valid: false, error: "Short text is required" };
    case "LONG_TEXT":
      return typeof value === "string" && value.trim().length > 0
        ? { valid: true }
        : { valid: false, error: "Long text is required" };
    case "CHECKBOX":
      if (!Array.isArray(value)) return { valid: false, error: "Checkbox must be an array" };
      if (options?.length && value.some((v) => typeof v !== "string" || !options.includes(v))) {
        return { valid: false, error: "Invalid checkbox option" };
      }
      return { valid: true };
    case "DROPDOWN":
      if (typeof value !== "string" || !value.trim()) {
        return { valid: false, error: "Dropdown selection is required" };
      }
      if (options?.length && !options.includes(value)) {
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
      return { valid: true };
    case "NUMBER": {
      if (value === null || value === undefined || value === "") {
        return { valid: false, error: "Number is required" };
      }
      const n = typeof value === "number" ? value : Number(value);
      if (Number.isNaN(n)) {
        return { valid: false, error: "Invalid number" };
      }
      return { valid: true };
    }
    default:
      return { valid: true };
  }
}
