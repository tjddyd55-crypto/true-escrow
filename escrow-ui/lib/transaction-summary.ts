import { isDatabaseConfigured, query } from "@/lib/db";
import * as engineStore from "@/lib/transaction-engine/store";
import { getTradeDetail } from "@/lib/trade-mvp/store";

export type SummaryActionType = "TASK" | "APPROVAL" | "FINAL";
export type StepperStatus = "DRAFT" | "ACTIVE" | "IN_PROGRESS" | "READY_FOR_FINAL_APPROVAL" | "COMPLETED";

export type TransactionSummaryAction = {
  type: SummaryActionType;
  blockId: string;
  conditionId?: string;
  title: string;
  dueDate: string | null;
};

export type TransactionSummaryBlock = {
  id: string;
  title: string;
  dueDate: string;
  extendedDueDate: string | null;
  status: string;
  requiredCount: number;
  confirmedCount: number;
  submittedCount: number;
  rejectedCount: number;
  progressPct: number;
  myTasksCount: number;
  myApprovalsCount: number;
};

export type TransactionSummary = {
  trade: { id: string; title: string; status: string; kind: "MVP" | "ENGINE" };
  participantRole: "BUYER" | "SELLER" | "VERIFIER" | null;
  stepperStatus: StepperStatus;
  blocks: TransactionSummaryBlock[];
  myNextActions: TransactionSummaryAction[];
};

function clampProgress(requiredCount: number, confirmedCount: number): number {
  if (requiredCount <= 0) return 0;
  return Math.max(0, Math.min(100, Math.floor((confirmedCount / requiredCount) * 100)));
}

function deriveStepperStatus(params: {
  tradeStatus: string;
  allApproved: boolean;
  hasReadyForFinal: boolean;
  hasAnyUnconfirmedRequired: boolean;
}): StepperStatus {
  if (params.tradeStatus === "DRAFT") return "DRAFT";
  if (params.allApproved || params.tradeStatus === "COMPLETED") return "COMPLETED";
  if (params.hasReadyForFinal) return "READY_FOR_FINAL_APPROVAL";
  if (params.tradeStatus === "ACTIVE" && params.hasAnyUnconfirmedRequired) return "IN_PROGRESS";
  if (params.tradeStatus === "ACTIVE") return "ACTIVE";
  return "IN_PROGRESS";
}

async function getMvpSummary(tradeId: string, userId: string): Promise<TransactionSummary | null> {
  const detail = await getTradeDetail(tradeId, userId);
  if (!detail) return null;

  const participantRole =
    detail.participants.find((p) => p.userId === userId && p.status === "ACCEPTED")?.role ?? null;

  const blockSummaries = detail.blocks.map((block) => {
    const conditions = detail.conditions.filter((c) => c.blockId === block.id);
    const requiredConditions = conditions.filter((c) => c.required);
    const confirmedRequired = requiredConditions.filter((c) => c.status === "CONFIRMED");
    const submittedCount = conditions.filter((c) => c.status === "SUBMITTED").length;
    const rejectedCount = conditions.filter((c) => c.status === "REJECTED").length;
    const myTasksCount = conditions.filter(
      (c) =>
        participantRole &&
        c.assignedRole === participantRole &&
        (c.status === "PENDING" || c.status === "REJECTED")
    ).length;
    const myApprovalsCount = conditions.filter(
      (c) => participantRole && c.confirmerRole === participantRole && c.status === "SUBMITTED"
    ).length;
    return {
      id: block.id,
      title: block.title,
      dueDate: block.dueDate,
      extendedDueDate: block.extendedDueDate ?? null,
      status: block.status,
      requiredCount: requiredConditions.length,
      confirmedCount: confirmedRequired.length,
      submittedCount,
      rejectedCount,
      progressPct: clampProgress(requiredConditions.length, confirmedRequired.length),
      myTasksCount,
      myApprovalsCount,
    } satisfies TransactionSummaryBlock;
  });

  const myNextActions: TransactionSummaryAction[] = [];
  if (participantRole) {
    for (const block of detail.blocks) {
      const conditions = detail.conditions.filter((c) => c.blockId === block.id);
      for (const condition of conditions) {
        if (
          condition.assignedRole === participantRole &&
          (condition.status === "PENDING" || condition.status === "REJECTED")
        ) {
          myNextActions.push({
            type: "TASK",
            blockId: block.id,
            conditionId: condition.id,
            title: condition.title,
            dueDate: block.extendedDueDate ?? block.dueDate,
          });
        }
        if (condition.confirmerRole === participantRole && condition.status === "SUBMITTED") {
          myNextActions.push({
            type: "APPROVAL",
            blockId: block.id,
            conditionId: condition.id,
            title: condition.title,
            dueDate: block.extendedDueDate ?? block.dueDate,
          });
        }
      }
      if (block.finalApproverRole === participantRole && block.status === "READY_FOR_FINAL_APPROVAL") {
        myNextActions.push({
          type: "FINAL",
          blockId: block.id,
          title: `${block.title} 최종 승인`,
          dueDate: block.extendedDueDate ?? block.dueDate,
        });
      }
    }
  }

  const allApproved = detail.blocks.length > 0 && detail.blocks.every((b) => b.status === "APPROVED");
  const hasReadyForFinal = detail.blocks.some((b) => b.status === "READY_FOR_FINAL_APPROVAL");
  const hasAnyUnconfirmedRequired = detail.conditions.some((c) => c.required && c.status !== "CONFIRMED");

  return {
    trade: {
      id: detail.trade.id,
      title: detail.trade.title,
      status: detail.trade.status ?? "DRAFT",
      kind: "MVP",
    },
    participantRole,
    stepperStatus: deriveStepperStatus({
      tradeStatus: detail.trade.status ?? "DRAFT",
      allApproved,
      hasReadyForFinal,
      hasAnyUnconfirmedRequired,
    }),
    blocks: blockSummaries,
    myNextActions,
  };
}

async function getEngineQuestionSummaryByBlock(tradeId: string, blockId: string): Promise<{
  requiredCount: number;
  confirmedCount: number;
}> {
  if (!isDatabaseConfigured()) return { requiredCount: 0, confirmedCount: 0 };
  const rows = await query<{ required_count: string; confirmed_count: string }>(
    `SELECT
       count(*) FILTER (WHERE q.required = true)::text AS required_count,
       count(*) FILTER (
         WHERE q.required = true
           AND EXISTS (
             SELECT 1
             FROM escrow_block_answers a
             WHERE a.trade_id = $1
               AND a.block_id = $2
               AND a.question_id = q.id
           )
       )::text AS confirmed_count
     FROM escrow_block_questions q
     WHERE q.block_id = $2`,
    [tradeId, blockId]
  );
  const row = rows.rows[0];
  return {
    requiredCount: Number(row?.required_count ?? "0"),
    confirmedCount: Number(row?.confirmed_count ?? "0"),
  };
}

async function getEngineSummary(tradeId: string, userId: string): Promise<TransactionSummary | null> {
  const trade = engineStore.getTransaction(tradeId);
  if (!trade) return null;
  const blocks = engineStore.getBlocks(tradeId).sort((a, b) => a.orderIndex - b.orderIndex);

  const participantRole =
    trade.buyerId === userId
      ? "BUYER"
      : trade.sellerId === userId
        ? "SELLER"
        : trade.initiatorId === userId
          ? trade.initiatorRole
          : null;

  const blockSummaries: TransactionSummaryBlock[] = [];
  const myNextActions: TransactionSummaryAction[] = [];

  for (const block of blocks) {
    const questionSummary = await getEngineQuestionSummaryByBlock(tradeId, block.id);
    const progressPct = clampProgress(questionSummary.requiredCount, questionSummary.confirmedCount);
    const myTasksCount =
      participantRole === "SELLER" && block.status !== "APPROVED" && block.status !== "CANCELLED"
        ? Math.max(0, questionSummary.requiredCount - questionSummary.confirmedCount)
        : 0;
    const myApprovalsCount =
      participantRole === "BUYER" && (block.status === "SUBMITTED" || block.status === "REVIEWING") ? 1 : 0;

    blockSummaries.push({
      id: block.id,
      title: block.title,
      dueDate: block.dueDate,
      extendedDueDate: block.extensions.length
        ? block.extensions[block.extensions.length - 1]?.newDueDate ?? null
        : null,
      status: block.status,
      requiredCount: questionSummary.requiredCount,
      confirmedCount: questionSummary.confirmedCount,
      submittedCount: block.status === "SUBMITTED" ? 1 : 0,
      rejectedCount: block.status === "REJECTED" ? 1 : 0,
      progressPct,
      myTasksCount,
      myApprovalsCount,
    });

    if (myTasksCount > 0) {
      myNextActions.push({
        type: "TASK",
        blockId: block.id,
        title: `${block.title} 작성/제출`,
        dueDate: block.dueDate,
      });
    }
    if (myApprovalsCount > 0) {
      myNextActions.push({
        type: "APPROVAL",
        blockId: block.id,
        title: `${block.title} 승인/반려`,
        dueDate: block.dueDate,
      });
    }
  }

  const allApproved = blocks.length > 0 && blocks.every((b) => b.status === "APPROVED");
  const hasReadyForFinal = blocks.some((b) => b.status === "SUBMITTED" || b.status === "REVIEWING");
  const hasAnyUnconfirmedRequired = blockSummaries.some((b) => b.requiredCount > b.confirmedCount);

  return {
    trade: {
      id: trade.id,
      title: trade.title,
      status: trade.status,
      kind: "ENGINE",
    },
    participantRole,
    stepperStatus: deriveStepperStatus({
      tradeStatus: trade.status,
      allApproved,
      hasReadyForFinal,
      hasAnyUnconfirmedRequired,
    }),
    blocks: blockSummaries,
    myNextActions,
  };
}

export async function getTransactionSummary(
  tradeId: string,
  userId: string
): Promise<TransactionSummary | null> {
  const mvp = await getMvpSummary(tradeId, userId);
  if (mvp) return mvp;
  return getEngineSummary(tradeId, userId);
}
