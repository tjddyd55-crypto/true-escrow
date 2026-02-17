import { describe, it, expect } from "vitest";
import { validateAnswerByType } from "../validateAnswer";

describe("validateAnswerByType", () => {
  it("SHORT_TEXT: empty invalid", () => {
    expect(validateAnswerByType("SHORT_TEXT", "")).toEqual({ valid: false, error: "Short text is required" });
    expect(validateAnswerByType("SHORT_TEXT", "   ")).toEqual({ valid: false, error: "Short text is required" });
  });
  it("SHORT_TEXT: non-empty valid", () => {
    expect(validateAnswerByType("SHORT_TEXT", "ok")).toEqual({ valid: true });
  });
  it("LONG_TEXT: empty invalid", () => {
    expect(validateAnswerByType("LONG_TEXT", "")).toEqual({ valid: false, error: "Long text is required" });
  });
  it("LONG_TEXT: non-empty valid", () => {
    expect(validateAnswerByType("LONG_TEXT", "paragraph")).toEqual({ valid: true });
  });
  it("DROPDOWN: empty invalid", () => {
    expect(validateAnswerByType("DROPDOWN", "")).toEqual({ valid: false, error: "Dropdown selection is required" });
  });
  it("DROPDOWN: valid option", () => {
    expect(
      validateAnswerByType("DROPDOWN", "A", {
        choices: [
          { value: "A", label: "A" },
          { value: "B", label: "B" },
        ],
      })
    ).toEqual({ valid: true });
  });
  it("DROPDOWN: invalid option", () => {
    expect(
      validateAnswerByType("DROPDOWN", "C", {
        choices: [
          { value: "A", label: "A" },
          { value: "B", label: "B" },
        ],
      })
    ).toEqual({ valid: false, error: "Invalid dropdown option" });
  });
  it("CHECKBOX: empty invalid for required", () => {
    expect(validateAnswerByType("CHECKBOX", [])).toEqual({
      valid: false,
      error: "At least one checkbox option is required",
    });
  });
  it("DATE: invalid format", () => {
    expect(validateAnswerByType("DATE", "not-a-date")).toEqual({ valid: false, error: "Date must be YYYY-MM-DD" });
  });
  it("DATE: valid ISO", () => {
    expect(validateAnswerByType("DATE", "2025-02-06")).toEqual({ valid: true });
  });
  it("NUMBER: NaN invalid", () => {
    expect(validateAnswerByType("NUMBER", "abc")).toEqual({ valid: false, error: "Invalid number" });
  });
  it("NUMBER: number valid", () => {
    expect(validateAnswerByType("NUMBER", 42)).toEqual({ valid: true });
  });
  it("NUMBER: numeric string valid", () => {
    expect(validateAnswerByType("NUMBER", "42")).toEqual({ valid: true });
  });
  it("FILE(legacy): requires attachment", () => {
    expect(validateAnswerByType("FILE", null)).toEqual({ valid: false, error: "File attachment is required" });
    expect(validateAnswerByType("FILE", null, undefined, { hasAttachment: true })).toEqual({ valid: true });
  });
  it("RADIO: validates allowed choice", () => {
    expect(
      validateAnswerByType("RADIO", "A", {
        choices: [
          { value: "A", label: "A" },
          { value: "B", label: "B" },
        ],
      })
    ).toEqual({ valid: true });
    expect(
      validateAnswerByType("RADIO", "C", {
        choices: [
          { value: "A", label: "A" },
          { value: "B", label: "B" },
        ],
      })
    ).toEqual({ valid: false, error: "Invalid radio option" });
  });
  it("GRID_SINGLE: validates row and column", () => {
    expect(
      validateAnswerByType("GRID_SINGLE", { row: "품질", column: "좋음" }, { rows: ["품질"], columns: ["좋음", "보통"] })
    ).toEqual({ valid: true });
    expect(
      validateAnswerByType("GRID_SINGLE", { row: "속도", column: "좋음" }, { rows: ["품질"], columns: ["좋음"] })
    ).toEqual({ valid: false, error: "Invalid grid row" });
  });
});
