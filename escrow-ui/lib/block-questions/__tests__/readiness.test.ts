import { describe, it, expect } from "vitest";
import { computeBlockReadiness } from "../readiness";

describe("computeBlockReadiness", () => {
  it("returns missing required checkbox/date", async () => {
    const questions = [
      { id: "q1", type: "CHECKBOX", required: true, options: { choices: [{ value: "A", label: "A" }] } },
      { id: "q2", type: "DATE", required: true, options: {} },
    ];
    const answers: Record<string, unknown> = {
      q1: [],
      q2: "invalid-date",
    };
    const result = await computeBlockReadiness({
      questions,
      getAnswer: async (questionId) => answers[questionId],
      hasAttachment: async () => false,
    });
    expect(result.ready).toBe(false);
    expect(result.missingRequired.map((x) => x.questionId)).toEqual(["q1", "q2"]);
  });

  it("returns ready when required questions are satisfied", async () => {
    const questions = [
      { id: "q1", type: "CHECKBOX", required: true, options: { choices: [{ value: "A", label: "A" }] } },
      { id: "q2", type: "DATE", required: true, options: {} },
    ];
    const answers: Record<string, unknown> = {
      q1: ["A"],
      q2: "2026-02-17",
    };
    const result = await computeBlockReadiness({
      questions,
      getAnswer: async (questionId) => answers[questionId],
      hasAttachment: async () => true,
    });
    expect(result.ready).toBe(true);
    expect(result.missingRequired).toHaveLength(0);
  });
});
