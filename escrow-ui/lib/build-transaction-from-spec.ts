/**
 * TemplateSpec → TransactionGraph.
 * 엔진 생성 로직 분리: 템플릿은 순수 스펙만, 변환은 여기서만.
 */

import crypto from "crypto";
import type { TransactionGraph, Block, ApprovalPolicy, BlockApprover, WorkRule } from "@/lib/transaction-engine/types";
import type { TemplateSpec } from "@/lib/template-spec.schema";
import { addDays, daysBetween } from "@/lib/transaction-engine/dateUtils";

const APPROVAL_ROLE_MAP = { buyer: "BUYER" as const, seller: "SELLER" as const, admin: "ADMIN" as const };

export type BuildFromSpecParams = {
  title: string;
  description?: string;
  initiatorId: string;
  initiatorRole: "BUYER" | "SELLER";
  buyerId?: string;
  sellerId?: string;
  startDate: string;
  endDate: string;
};

export function buildTransactionFromTemplateSpec(
  spec: TemplateSpec,
  params: BuildFromSpecParams
): TransactionGraph {
  const txId = crypto.randomUUID();
  const totalDays = daysBetween(params.startDate, params.endDate);
  const n = spec.blocks.length;
  const daysPerBlock = Math.max(1, Math.floor(totalDays / n));

  const transaction = {
    id: txId,
    title: params.title,
    description: params.description,
    initiatorId: params.initiatorId,
    initiatorRole: params.initiatorRole,
    status: "DRAFT" as const,
    createdAt: new Date().toISOString(),
    buyerId: params.buyerId,
    sellerId: params.sellerId,
    startDate: params.startDate,
    endDate: params.endDate,
  };

  const blocks: Block[] = [];
  const approvalPolicies: ApprovalPolicy[] = [];
  const blockApprovers: BlockApprover[] = [];
  const workRules: WorkRule[] = [];

  spec.blocks
    .slice()
    .sort((a, b) => a.sequence - b.sequence)
    .forEach((blockSpec, index) => {
      const policyId = crypto.randomUUID();
      const blockId = crypto.randomUUID();
      const startDate =
        index === 0 ? params.startDate : addDays(params.startDate, index * daysPerBlock);
      const endDate =
        index === n - 1 ? params.endDate : addDays(params.startDate, (index + 1) * daysPerBlock - 1);

      approvalPolicies.push({ id: policyId, type: "SINGLE" });
      blocks.push({
        id: blockId,
        transactionId: txId,
        title: blockSpec.title_key,
        startDate,
        endDate,
        orderIndex: blockSpec.sequence,
        approvalPolicyId: policyId,
        isActive: false,
      });
      blockApprovers.push({
        id: crypto.randomUUID(),
        blockId,
        role: APPROVAL_ROLE_MAP[blockSpec.approval.role],
        required: true,
      });
      const dueDay = Math.min(daysBetween(params.startDate, endDate), totalDays);
      workRules.push({
        id: crypto.randomUUID(),
        blockId,
        workType: "CUSTOM",
        title: blockSpec.title_key,
        quantity: 1,
        frequency: "ONCE",
        dueDates: [dueDay],
      });
    });

  return {
    transaction,
    blocks,
    approvalPolicies,
    blockApprovers,
    workRules,
    workItems: [],
  };
}
