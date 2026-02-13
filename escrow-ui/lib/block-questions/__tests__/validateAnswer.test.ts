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
    expect(validateAnswerByType("DROPDOWN", "A", ["A", "B"])).toEqual({ valid: true });
  });
  it("DROPDOWN: invalid option", () => {
    expect(validateAnswerByType("DROPDOWN", "C", ["A", "B"])).toEqual({ valid: false, error: "Invalid dropdown option" });
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
  it("FILE: always valid (placeholder)", () => {
    expect(validateAnswerByType("FILE", null)).toEqual({ valid: true });
  });
});
