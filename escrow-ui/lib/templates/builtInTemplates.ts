import type { TemplateSpec } from "@/lib/template-spec.schema";

export type BuiltInTemplateRow = {
  template_key: string;
  label_key: string;
  description_key: string | null;
  defaults: TemplateSpec;
};

const QUICK_DELIVERY_SPEC: TemplateSpec = {
  blocks: [
    {
      sequence: 1,
      title_key: "template.quick_delivery.block_payment",
      amount: { type: "FULL" },
      approval: { role: "buyer", auto: true },
    },
    {
      sequence: 2,
      title_key: "template.quick_delivery.block_receive",
      amount: { type: "FULL" },
      approval: { role: "buyer", auto: false },
    },
  ],
};

const MOVING_SERVICE_SPEC: TemplateSpec = {
  blocks: [
    {
      sequence: 1,
      title_key: "template.moving_service.block_deposit",
      amount: { type: "RATIO", value: 0.2 },
      approval: { role: "buyer", auto: false },
    },
    {
      sequence: 2,
      title_key: "template.moving_service.block_start",
      amount: { type: "NONE" },
      approval: { role: "buyer", auto: false },
    },
    {
      sequence: 3,
      title_key: "template.moving_service.block_complete",
      amount: { type: "NONE" },
      approval: { role: "buyer", auto: false },
    },
    {
      sequence: 4,
      title_key: "template.moving_service.block_final",
      amount: { type: "RATIO", value: 0.8 },
      approval: { role: "buyer", auto: true },
    },
  ],
};

export const BUILT_IN_TEMPLATES: BuiltInTemplateRow[] = [
  {
    template_key: "QUICK_DELIVERY",
    label_key: "template.quick_delivery.title",
    description_key: "template.quick_delivery.description",
    defaults: QUICK_DELIVERY_SPEC,
  },
  {
    template_key: "MOVING_SERVICE",
    label_key: "template.moving_service.title",
    description_key: "template.moving_service.description",
    defaults: MOVING_SERVICE_SPEC,
  },
];

export function getBuiltInTemplateByKey(templateKey: string): BuiltInTemplateRow | null {
  return BUILT_IN_TEMPLATES.find((t) => t.template_key === templateKey) ?? null;
}
