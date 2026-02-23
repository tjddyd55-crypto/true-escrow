import { validateAnswerByType } from "@/lib/block-questions/validateAnswer";
import { normalizeQuestionOptions } from "@/lib/block-questions/options";

export type ReadinessQuestion = {
  id: string;
  type: string;
  required: boolean;
  allow_attachment?: boolean;
  options: unknown;
};

export type MissingRequired = {
  questionId: string;
  reason: string;
};

export async function computeBlockReadiness(params: {
  questions: ReadinessQuestion[];
  getAnswer: (questionId: string) => Promise<unknown>;
  hasAttachment: (questionId: string) => Promise<boolean>;
}): Promise<{ ready: boolean; missingRequired: MissingRequired[] }> {
  const missingRequired: MissingRequired[] = [];

  for (const q of params.questions) {
    if (!q.required) continue;
    const answer = await params.getAnswer(q.id);
    const options = normalizeQuestionOptions(q.options);
    const hasAttachment =
      q.allow_attachment || q.type === "FILE" || q.type === "FILE_UPLOAD"
        ? await params.hasAttachment(q.id)
        : false;
    const result = validateAnswerByType(q.type, answer, options, { hasAttachment });
    if (!result.valid) {
      missingRequired.push({
        questionId: q.id,
        reason: result.error ?? "Required question is not satisfied",
      });
    }
  }

  return { ready: missingRequired.length === 0, missingRequired };
}
