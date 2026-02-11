/**
 * Template defaults = 순수 거래 스펙만 저장.
 * Engine이 TransactionGraph로 변환할 때 사용.
 */

import { z } from "zod";

const amountTypeSchema = z.enum(["FULL", "RATIO", "FIXED", "NONE"]);
const approvalRoleSchema = z.enum(["buyer", "seller", "admin"]);

const amountSchema = z
  .object({
    type: amountTypeSchema,
    value: z.number().optional(),
  })
  .refine(
    (data) => {
      if (data.type === "RATIO" || data.type === "FIXED") return typeof data.value === "number";
      return true;
    },
    { message: "value required for RATIO or FIXED" }
  );

const blockSpecSchema = z.object({
  sequence: z.number().int().min(1),
  title_key: z.string().min(1),
  amount: amountSchema,
  approval: z.object({
    role: approvalRoleSchema,
    auto: z.boolean(),
  }),
});

export const templateSpecSchema = z.object({
  blocks: z.array(blockSpecSchema).min(1),
});

export type TemplateSpec = z.infer<typeof templateSpecSchema>;

export type TemplateSpecBlock = z.infer<typeof blockSpecSchema>;

export function parseTemplateSpec(defaults: unknown): TemplateSpec {
  return templateSpecSchema.parse(defaults);
}

export function safeParseTemplateSpec(defaults: unknown): { success: true; data: TemplateSpec } | { success: false; error: string } {
  const result = templateSpecSchema.safeParse(defaults);
  if (result.success) return { success: true, data: result.data };
  return { success: false, error: "TemplateSpec validation failed" };
}
