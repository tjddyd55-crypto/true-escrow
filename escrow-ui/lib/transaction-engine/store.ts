/**
 * Transaction Engine Store - In-memory JSON store with optional file persistence
 */

import type {
  Transaction,
  TransactionGraph,
  Block,
  ApprovalPolicy,
  BlockApprover,
  WorkRule,
  WorkItem,
  TransactionStatus,
  ApprovalPolicyType,
  WorkFrequency,
  WorkItemStatus,
} from "./types";
import { appendLog } from "./log";
import { addDays, daysBetween } from "./dateUtils";
import crypto from "crypto";
import fs from "fs";
import path from "path";

// In-memory store
let transactions: Transaction[] = [];
let blocks: Block[] = [];
let approvalPolicies: ApprovalPolicy[] = [];
let blockApprovers: BlockApprover[] = [];
let workRules: WorkRule[] = [];
let workItems: WorkItem[] = [];

const DATA_FILE =
  process.env.TRANSACTION_ENGINE_DATA_FILE ||
  path.join(process.cwd(), ".data", "transaction-engine.json");

// Migrate old data (startDay/endDay -> startDate/endDate)
function migrateLoadedData(): void {
  const today = toISODate(new Date());
  const defaultEnd = addDays(today, 30);
  transactions.forEach((tx) => {
    if (!tx.startDate) (tx as Transaction).startDate = today;
    if (!tx.endDate) (tx as Transaction).endDate = defaultEnd;
  });
  blocks.forEach((b) => {
    const block = b as Block & { startDay?: number; endDay?: number };
    if (block.startDate && block.endDate) return;
    const tx = findTransaction(block.transactionId);
    const base = tx?.startDate ?? today;
    if (block.startDay != null && block.endDay != null) {
      (block as Block).startDate = addDays(base, block.startDay - 1);
      (block as Block).endDate = addDays(base, block.endDay - 1);
    } else {
      (block as Block).startDate = base;
      (block as Block).endDate = addDays(base, 6);
    }
  });
  ensureUniqueWorkRuleIds();
}

/** Ensure every work rule has a unique id; fix workItems references. Call after load or before returning graph. */
function ensureUniqueWorkRuleIds(): void {
  const seen = new Set<string>();
  workRules.forEach((wr) => {
    if (!wr.id || seen.has(wr.id)) {
      const oldId = wr.id;
      (wr as WorkRule).id = generateId();
      seen.add(wr.id);
      if (oldId) {
        workItems.filter((wi) => wi.workRuleId === oldId).forEach((wi) => {
          (wi as { workRuleId: string }).workRuleId = wr.id;
        });
      }
    } else {
      seen.add(wr.id);
    }
  });
}

// Load from file if exists (dev only)
function loadFromFile(): void {
  if (typeof window !== "undefined") return; // Browser environment

  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
      transactions = data.transactions || [];
      blocks = data.blocks || [];
      approvalPolicies = data.approvalPolicies || [];
      blockApprovers = data.blockApprovers || [];
      workRules = data.workRules || [];
      workItems = data.workItems || [];
      migrateLoadedData();
    }
  } catch (error) {
    console.error("Failed to load store from file:", error);
  }
}

// Save to file (dev only)
function saveToFile(): void {
  if (typeof window !== "undefined") return; // Browser environment
  
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(
      DATA_FILE,
      JSON.stringify({
        transactions,
        blocks,
        approvalPolicies,
        blockApprovers,
        // Deprecated: workRules/workItems are intentionally excluded from persistence.
      }, null, 2)
    );
  } catch (error) {
    console.error("Failed to save store to file:", error);
  }
}

// Initialize on server
if (typeof window === "undefined") {
  loadFromFile();
}

/** Stable UUID for all entities. Never use array index, role, or type as identifier. */
function generateId(): string {
  return crypto.randomUUID();
}

function findTransaction(id: string): Transaction | undefined {
  return transactions.find((t) => t.id === id);
}

function isDraft(transactionId: string): boolean {
  const tx = findTransaction(transactionId);
  return tx?.status === "DRAFT";
}

// CRUD Operations

function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function createTransaction(payload: {
  title: string;
  description?: string;
  initiatorId: string;
  initiatorRole: "BUYER" | "SELLER";
  buyerId?: string;
  sellerId?: string;
  startDate?: string;
  endDate?: string;
}): Transaction {
  const today = toISODate(new Date());
  const defaultEnd = addDays(today, 30);
  const transaction: Transaction = {
    id: generateId(),
    title: payload.title,
    description: payload.description,
    initiatorId: payload.initiatorId,
    initiatorRole: payload.initiatorRole,
    status: "DRAFT",
    createdAt: new Date().toISOString(),
    buyerId: payload.buyerId,
    sellerId: payload.sellerId,
    startDate: payload.startDate ?? today,
    endDate: payload.endDate ?? defaultEnd,
  };
  transactions.push(transaction);
  appendLog(transaction.id, "ADMIN", "TRANSACTION_CREATED", { title: payload.title });
  saveToFile();
  return transaction;
}

export function getTransaction(id: string): Transaction | undefined {
  return transactions.find((t) => t.id === id);
}

function recomputeTradePeriod(sourceBlocks: Block[]): { startDate: string | null; endDate: string | null } {
  if (sourceBlocks.length === 0) {
    return { startDate: null, endDate: null };
  }

  const startDate = sourceBlocks.reduce((min, b) =>
    new Date(b.startDate).getTime() < new Date(min).getTime() ? b.startDate : min
  , sourceBlocks[0].startDate);
  const endDate = sourceBlocks.reduce((max, b) =>
    new Date(b.endDate).getTime() > new Date(max).getTime() ? b.endDate : max
  , sourceBlocks[0].endDate);
  return { startDate, endDate };
}

function recalculateTransactionRangeFromBlocks(transactionId: string): void {
  const tx = findTransaction(transactionId);
  if (!tx) return;
  const txBlocks = blocks.filter((b) => b.transactionId === transactionId);
  const { startDate, endDate } = recomputeTradePeriod(txBlocks);
  tx.startDate = startDate ?? tx.startDate;
  tx.endDate = endDate ?? tx.endDate;
}

/**
 * Suggested default dates for a new block (suggestions only; user may adjust).
 * Transaction period is derived from blocks, so this function does not clamp to tx dates.
 */
export function getSuggestedBlockDates(transactionId: string): { startDate: string; endDate: string } | null {
  const tx = findTransaction(transactionId);
  if (!tx) return null;

  const existing = blocks.filter((b) => b.transactionId === transactionId).sort((a, b) => a.orderIndex - b.orderIndex);
  const today = toISODate(new Date());
  if (existing.length === 0) {
    const baseStart = tx.startDate ?? today;
    const baseEnd = tx.endDate ?? addDays(baseStart, 6);
    return { startDate: baseStart, endDate: baseEnd };
  }

  const last = existing[existing.length - 1];
  const startDate = addDays(last.endDate, 1);
  return { startDate, endDate: addDays(startDate, 6) };
}

/** Last day of first half when splitting a block (inclusive). First half has floor(duration/2) days. */
function midDateForSplit(startDate: string, endDate: string): string {
  const duration = daysBetween(startDate, endDate);
  if (duration <= 1) return startDate;
  return addDays(startDate, Math.floor(duration / 2) - 1);
}

/**
 * Add a block: use suggested gap if any; otherwise split the longest block to make room (auto-split).
 * Ensures "add block" always succeeds when transaction has at least one block with duration >= 2.
 */
export function addBlockWithAutoSplit(
  transactionId: string,
  options: {
    title?: string;
    orderIndex?: number;
    approvalType?: ApprovalPolicyType;
    threshold?: number;
  } = {}
): Block {
  if (!isDraft(transactionId)) {
    throw new Error("Blocks can only be added in DRAFT status");
  }

  const tx = findTransaction(transactionId);
  if (!tx) {
    throw new Error("Transaction not found");
  }

  const existing = blocks.filter((b) => b.transactionId === transactionId).sort((a, b) => a.orderIndex - b.orderIndex);

  const suggested = getSuggestedBlockDates(transactionId);
  if (suggested) {
    const policy = createApprovalPolicy({
      type: options.approvalType ?? "SINGLE",
      threshold: options.threshold,
    });
    const orderIndex = options.orderIndex ?? existing.length + 1;
    return addBlock(transactionId, {
      title: options.title ?? `Block ${orderIndex}`,
      startDate: suggested.startDate,
      endDate: suggested.endDate,
      orderIndex,
      approvalPolicyId: policy.id,
    });
  }

  if (existing.length === 0) {
    const baseStart = tx.startDate ?? toISODate(new Date());
    const baseEnd = tx.endDate ?? addDays(baseStart, 6);
    const policy = createApprovalPolicy({
      type: options.approvalType ?? "SINGLE",
      threshold: options.threshold,
    });
    return addBlock(transactionId, {
      title: options.title ?? "Block 1",
      startDate: baseStart,
      endDate: baseEnd,
      orderIndex: 1,
      approvalPolicyId: policy.id,
    });
  }

  const longest = [...existing].sort(
    (a, b) => daysBetween(b.startDate, b.endDate) - daysBetween(a.startDate, a.endDate)
  )[0];
  const duration = daysBetween(longest.startDate, longest.endDate);
  if (duration <= 1) {
    throw new Error("Cannot split block further");
  }

  const mid = midDateForSplit(longest.startDate, longest.endDate);
  const originalEnd = longest.endDate;
  const newBlockStart = addDays(mid, 1);

  const newPolicy: ApprovalPolicy = {
    id: generateId(),
    type: options.approvalType ?? "SINGLE",
    threshold: options.threshold,
  };
  const newBlock: Block = {
    id: generateId(),
    transactionId,
    title: options.title ?? `Block ${existing.length + 1}`,
    startDate: newBlockStart,
    endDate: originalEnd,
    orderIndex: longest.orderIndex + 1,
    approvalPolicyId: newPolicy.id,
    isActive: false,
  };
  const newApprover: BlockApprover = {
    id: generateId(),
    blockId: newBlock.id,
    role: "BUYER",
    required: true,
  };
  const updatedBlocks: Block[] = existing.map((b) => {
    if (b.id === longest.id) {
      return { ...b, endDate: mid };
    }
    if (b.orderIndex > longest.orderIndex) {
      return { ...b, orderIndex: b.orderIndex + 1 };
    }
    return { ...b };
  });
  updatedBlocks.push(newBlock);
  updatedBlocks.sort((a, b) => a.orderIndex - b.orderIndex);

  const approvalPoliciesForTx = existing.map((b) => getApprovalPolicy(b.approvalPolicyId)).filter(Boolean) as ApprovalPolicy[];
  const blockApproversForTx = existing.flatMap((b) => getBlockApprovers(b.id));
  const workRulesForTx = existing.flatMap((b) => getWorkRules(b.id));
  const workItemsForTx = existing.flatMap((b) => getWorkItemsByBlock(b.id));

  const graph: TransactionGraph = {
    transaction: { ...tx },
    blocks: updatedBlocks,
    approvalPolicies: [...approvalPoliciesForTx, newPolicy],
    blockApprovers: [...blockApproversForTx, newApprover],
    workRules: workRulesForTx,
    workItems: workItemsForTx,
  };
  saveTransactionGraph(graph);
  appendLog(transactionId, "ADMIN", "BLOCK_ADDED", { blockId: newBlock.id });
  return newBlock;
}

export function listTransactions(): Transaction[] {
  return [...transactions];
}

export function saveTransactionGraph(graph: TransactionGraph): void {
  // Idempotency: no duplicate ids in graph
  const blockIds = new Set(graph.blocks.map((b) => b.id));
  if (blockIds.size !== graph.blocks.length) throw new Error("Duplicate blocks detected");
  const policyIds = new Set(graph.approvalPolicies.map((p) => p.id));
  if (policyIds.size !== graph.approvalPolicies.length) throw new Error("Duplicate approvalPolicies detected");
  const approverIds = new Set(graph.blockApprovers.map((a) => a.id));
  if (approverIds.size !== graph.blockApprovers.length) throw new Error("Duplicate blockApprovers detected");
  // Replace only: remove this graph's entities, then assign graph's (no append/merge)
  const txId = graph.transaction.id;
  const blockIdList = graph.blocks.map((b) => b.id);
  const period = recomputeTradePeriod(graph.blocks);
  const normalizedTransaction =
    graph.blocks.length > 0
      ? {
          ...graph.transaction,
          startDate: period.startDate ?? graph.transaction.startDate,
          endDate: period.endDate ?? graph.transaction.endDate,
        }
      : graph.transaction;

  const txIndex = transactions.findIndex((t) => t.id === txId);
  if (txIndex >= 0) {
    transactions[txIndex] = normalizedTransaction;
  } else {
    transactions = [...transactions, normalizedTransaction];
  }

  blocks = [...blocks.filter((b) => b.transactionId !== txId), ...graph.blocks];

  const graphPolicyIds = new Set(graph.approvalPolicies.map((p) => p.id));
  approvalPolicies = [...approvalPolicies.filter((p) => !graphPolicyIds.has(p.id)), ...graph.approvalPolicies];

  blockApprovers = [...blockApprovers.filter((ba) => !blockIdList.includes(ba.blockId)), ...graph.blockApprovers];
  // Deprecated: ignore graph.workRules / graph.workItems (legacy read-only data).

  saveToFile();
}

export function activateTransaction(id: string): Transaction {
  const tx = findTransaction(id);
  if (!tx) {
    throw new Error("Transaction not found");
  }
  if (tx.status !== "DRAFT") {
    throw new Error("Only DRAFT transactions can be activated");
  }

  tx.status = "ACTIVE";
  saveToFile();

  // Activate first block
  const txBlocks = blocks.filter((b) => b.transactionId === id).sort((a, b) => a.orderIndex - b.orderIndex);
  if (txBlocks.length > 0) {
    const firstBlock = txBlocks[0];
    firstBlock.isActive = true;
    appendLog(id, "ADMIN", "BLOCK_ACTIVATED", { blockId: firstBlock.id });
  }

  appendLog(id, "ADMIN", "TRANSACTION_ACTIVATED");
  saveToFile();
  return tx;
}

export function updateBlock(id: string, patch: Partial<Block>): Block {
  const block = blocks.find((b) => b.id === id);
  if (!block) {
    throw new Error("Block not found");
  }
  if (!isDraft(block.transactionId)) {
    throw new Error("Block can only be updated in DRAFT status");
  }

  const newStart = patch.startDate ?? block.startDate;
  const newEnd = patch.endDate ?? block.endDate;
  if (patch.startDate !== undefined || patch.endDate !== undefined) {
    if (newStart > newEnd) throw new Error("Block startDate must be before or equal to endDate");
    const others = blocks.filter((b) => b.transactionId === block.transactionId && b.id !== id);
    for (const b of others) {
      if (blocksOverlap(b.startDate, b.endDate, newStart, newEnd)) {
        throw new Error("Blocks cannot overlap");
      }
    }
  }

  Object.assign(block, patch);
  recalculateTransactionRangeFromBlocks(block.transactionId);
  saveToFile();
  return block;
}

function blocksOverlap(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string
): boolean {
  return aStart <= bEnd && bStart <= aEnd;
}

export function addBlock(transactionId: string, block: Omit<Block, "id" | "transactionId" | "isActive">): Block {
  if (!isDraft(transactionId)) {
    throw new Error("Blocks can only be added in DRAFT status");
  }

  const tx = findTransaction(transactionId);
  if (!tx) {
    throw new Error("Transaction not found");
  }

  const existing = blocks.filter((b) => b.transactionId === transactionId).sort((a, b) => a.orderIndex - b.orderIndex);
  for (const b of existing) {
    if (blocksOverlap(b.startDate, b.endDate, block.startDate, block.endDate)) {
      throw new Error("Blocks cannot overlap");
    }
  }
  if (block.startDate > block.endDate) {
    throw new Error("Block startDate must be before or equal to endDate");
  }

  const newBlock: Block = {
    ...block,
    id: generateId(),
    transactionId,
    isActive: false,
  };
  blocks.push(newBlock);
  recalculateTransactionRangeFromBlocks(transactionId);
  appendLog(transactionId, "ADMIN", "BLOCK_ADDED", { blockId: newBlock.id });
  saveToFile();
  return newBlock;
}

export function splitBlock(blockId: string, splitDateIso: string): { block1: Block; block2: Block } {
  const block = blocks.find((b) => b.id === blockId);
  if (!block) {
    throw new Error("Block not found");
  }
  if (!isDraft(block.transactionId)) {
    throw new Error("Block can only be split in DRAFT status");
  }
  if (splitDateIso <= block.startDate || splitDateIso >= block.endDate) {
    throw new Error("Split date must be within block period");
  }

  const block1End = addDays(splitDateIso, -1);
  const block1: Block = {
    ...block,
    id: generateId(),
    endDate: block1End,
  };
  const block2: Block = {
    ...block,
    id: generateId(),
    startDate: splitDateIso,
    orderIndex: block.orderIndex + 1,
  };

  blocks
    .filter((b) => b.transactionId === block.transactionId && b.orderIndex > block.orderIndex)
    .forEach((b) => {
      b.orderIndex += 1;
    });

  const blockIndex = blocks.findIndex((b) => b.id === blockId);
  blocks[blockIndex] = block1;
  blocks.push(block2);
  recalculateTransactionRangeFromBlocks(block.transactionId);

  workRules
    .filter((wr) => wr.blockId === blockId)
    .forEach((wr) => {
      wr.blockId = block1.id;
    });

  appendLog(block.transactionId, "ADMIN", "BLOCK_SPLIT", { blockId, splitDate: splitDateIso });
  saveToFile();

  return { block1, block2 };
}

export function addWorkRule(blockId: string, rule: Omit<WorkRule, "id" | "blockId">): WorkRule {
  const block = blocks.find((b) => b.id === blockId);
  if (!block) {
    throw new Error("Block not found");
  }
  if (!isDraft(block.transactionId)) {
    throw new Error("WorkRules can only be added in DRAFT status");
  }

  const newRule: WorkRule = {
    ...rule,
    id: generateId(),
    blockId,
  };
  workRules.push(newRule);
  appendLog(block.transactionId, "ADMIN", "WORK_RULE_ADDED", { workRuleId: newRule.id });
  saveToFile();
  return newRule;
}

export function updateWorkRule(ruleId: string, patch: Partial<WorkRule>): WorkRule {
  const rule = workRules.find((r) => r.id === ruleId);
  if (!rule) {
    throw new Error("WorkRule not found");
  }
  const block = blocks.find((b) => b.id === rule.blockId);
  if (!block || !isDraft(block.transactionId)) {
    throw new Error("WorkRules can only be updated in DRAFT status");
  }

  Object.assign(rule, patch);
  saveToFile();
  return rule;
}

export function deleteWorkRule(ruleId: string): void {
  const rule = workRules.find((r) => r.id === ruleId);
  if (!rule) {
    throw new Error("WorkRule not found");
  }
  const block = blocks.find((b) => b.id === rule.blockId);
  if (!block || !isDraft(block.transactionId)) {
    throw new Error("WorkRules can only be deleted in DRAFT status");
  }

  workRules = workRules.filter((r) => r.id !== ruleId);
  workItems = workItems.filter((wi) => wi.workRuleId !== ruleId);
  appendLog(block.transactionId, "ADMIN", "WORK_RULE_DELETED", { workRuleId: ruleId });
  saveToFile();
}

export function generateWorkItemsForBlock(blockId: string): WorkItem[] {
  const block = blocks.find((b) => b.id === blockId);
  if (!block) {
    throw new Error("Block not found");
  }

  const tx = findTransaction(block.transactionId);
  const transactionStartDate = tx?.startDate ?? block.startDate;

  const rules = workRules.filter((r) => r.blockId === blockId);
  const newItems: WorkItem[] = [];

  for (const rule of rules) {
    const dueDays = calculateDueDays(rule, block, transactionStartDate);

    for (const dueDay of dueDays) {
      const existing = workItems.find(
        (wi) => wi.workRuleId === rule.id && wi.dueDay === dueDay
      );
      if (existing) continue;

      const item: WorkItem = {
        id: generateId(),
        workRuleId: rule.id,
        dueDay,
        status: "PENDING",
      };
      workItems.push(item);
      newItems.push(item);
    }
  }

  saveToFile();
  return newItems;
}

/** Derive day indices (1-based from transaction start) from block dates. */
function blockDayRange(txStartDate: string, block: Block): { startDay: number; endDay: number } {
  const startDay = daysBetween(txStartDate, block.startDate);
  const endDay = daysBetween(txStartDate, block.endDate);
  return { startDay, endDay };
}

function calculateDueDays(rule: WorkRule, block: Block, transactionStartDate: string): number[] {
  const { startDay, endDay } = blockDayRange(transactionStartDate, block);

  if (rule.dueDates && rule.dueDates.length > 0) {
    return rule.dueDates.filter((d) => d >= startDay && d <= endDay).slice(0, rule.quantity);
  }

  const days: number[] = [];
  switch (rule.frequency) {
    case "ONCE":
      days.push(endDay);
      break;
    case "DAILY":
      for (let day = startDay; day <= endDay && days.length < rule.quantity; day++) {
        days.push(day);
      }
      break;
    case "WEEKLY":
      for (let day = startDay; day <= endDay && days.length < rule.quantity; day += 7) {
        days.push(day);
      }
      break;
    case "CUSTOM":
      days.push(endDay);
      break;
  }

  return days.slice(0, rule.quantity);
}

export function submitWorkItem(itemId: string): WorkItem {
  const item = workItems.find((i) => i.id === itemId);
  if (!item) {
    throw new Error("WorkItem not found");
  }
  if (item.status !== "PENDING") {
    throw new Error("Only PENDING items can be submitted");
  }

  item.status = "SUBMITTED";
  item.submittedAt = new Date().toISOString();
  const rule = workRules.find((r) => r.id === item.workRuleId);
  const block = rule ? blocks.find((b) => b.id === rule.blockId) : null;
  if (block) {
    appendLog(block.transactionId, "SELLER", "WORK_ITEM_SUBMITTED", { itemId });
  }
  saveToFile();
  return item;
}

export function approveWorkItem(itemId: string): WorkItem {
  const item = workItems.find((i) => i.id === itemId);
  if (!item) {
    throw new Error("WorkItem not found");
  }
  if (item.status !== "SUBMITTED") {
    throw new Error("Only SUBMITTED items can be approved");
  }

  item.status = "APPROVED";
  const rule = workRules.find((r) => r.id === item.workRuleId);
  const block = rule ? blocks.find((b) => b.id === rule.blockId) : null;
  if (block) {
    appendLog(block.transactionId, "BUYER", "WORK_ITEM_APPROVED", { itemId });
  }
  saveToFile();
  return item;
}

export function rejectWorkItem(itemId: string): WorkItem {
  const item = workItems.find((i) => i.id === itemId);
  if (!item) {
    throw new Error("WorkItem not found");
  }
  if (item.status !== "SUBMITTED") {
    throw new Error("Only SUBMITTED items can be rejected");
  }

  item.status = "REJECTED";
  const rule = workRules.find((r) => r.id === item.workRuleId);
  const block = rule ? blocks.find((b) => b.id === rule.blockId) : null;
  if (block) {
    appendLog(block.transactionId, "BUYER", "WORK_ITEM_REJECTED", { itemId });
  }
  saveToFile();
  return item;
}

export function approveBlock(blockId: string): Block {
  const block = blocks.find((b) => b.id === blockId);
  if (!block) {
    throw new Error("Block not found");
  }
  if (!block.isActive) {
    throw new Error("Only active blocks can be approved");
  }

  block.isActive = false;
  appendLog(block.transactionId, "BUYER", "BLOCK_APPROVED", { blockId });

  // Activate next block
  const txBlocks = blocks
    .filter((b) => b.transactionId === block.transactionId)
    .sort((a, b) => a.orderIndex - b.orderIndex);
  const nextBlock = txBlocks.find((b) => b.orderIndex > block.orderIndex);
  
  if (nextBlock) {
    nextBlock.isActive = true;
    appendLog(block.transactionId, "ADMIN", "BLOCK_ACTIVATED", { blockId: nextBlock.id });
  } else {
    // All blocks completed
    const tx = findTransaction(block.transactionId);
    if (tx) {
      tx.status = "COMPLETED";
      appendLog(block.transactionId, "ADMIN", "TRANSACTION_COMPLETED");
    }
  }

  saveToFile();
  return block;
}

// Getters
export function getBlocks(transactionId: string): Block[] {
  return blocks.filter((b) => b.transactionId === transactionId).sort((a, b) => a.orderIndex - b.orderIndex);
}

export function getBlockById(blockId: string): Block | undefined {
  return blocks.find((b) => b.id === blockId);
}

export function getApprovalPolicy(id: string): ApprovalPolicy | undefined {
  return approvalPolicies.find((p) => p.id === id);
}

export function getBlockApprovers(blockId: string): BlockApprover[] {
  return blockApprovers.filter((ba) => ba.blockId === blockId);
}

export function getWorkRules(blockId: string): WorkRule[] {
  return workRules.filter((r) => r.blockId === blockId);
}

export function getWorkItems(workRuleId: string): WorkItem[] {
  return workItems.filter((i) => i.workRuleId === workRuleId);
}

export function getWorkItemsByBlock(blockId: string): WorkItem[] {
  const ruleIds = workRules.filter((r) => r.blockId === blockId).map((r) => r.id);
  return workItems.filter((i) => ruleIds.includes(i.workRuleId));
}

export function createApprovalPolicy(policy: Omit<ApprovalPolicy, "id">): ApprovalPolicy {
  const newPolicy: ApprovalPolicy = {
    ...policy,
    id: generateId(),
  };
  approvalPolicies.push(newPolicy);
  saveToFile();
  return newPolicy;
}

export function updateApprovalPolicy(
  policyId: string,
  patch: Partial<Omit<ApprovalPolicy, "id">>
): ApprovalPolicy {
  const policy = approvalPolicies.find((p) => p.id === policyId);
  if (!policy) throw new Error("Approval policy not found");
  const block = blocks.find((b) => b.approvalPolicyId === policyId);
  if (!block || !isDraft(block.transactionId)) {
    throw new Error("Approval policy can only be updated in DRAFT status");
  }
  Object.assign(policy, patch);
  saveToFile();
  return policy;
}

export function addBlockApprover(approver: Omit<BlockApprover, "id">): BlockApprover {
  const block = blocks.find((b) => b.id === approver.blockId);
  if (!block) {
    throw new Error("Block not found");
  }
  if (!isDraft(block.transactionId)) {
    throw new Error("Approvers can only be added in DRAFT status");
  }

  const newApprover: BlockApprover = {
    ...approver,
    id: generateId(),
  };
  blockApprovers.push(newApprover);
  saveToFile();
  return newApprover;
}

export function updateBlockApprover(approverId: string, patch: Partial<Omit<BlockApprover, "id" | "blockId">>): BlockApprover {
  const approver = blockApprovers.find((a) => a.id === approverId);
  if (!approver) {
    throw new Error("Approver not found");
  }
  const block = blocks.find((b) => b.id === approver.blockId);
  if (!block || !isDraft(block.transactionId)) {
    throw new Error("Approvers can only be updated in DRAFT status");
  }
  
  Object.assign(approver, patch);
  saveToFile();
  return approver;
}

export function deleteBlockApprover(approverId: string): void {
  const approver = blockApprovers.find((a) => a.id === approverId);
  if (!approver) {
    throw new Error("Approver not found");
  }
  const block = blocks.find((b) => b.id === approver.blockId);
  if (!block || !isDraft(block.transactionId)) {
    throw new Error("Approvers can only be deleted in DRAFT status");
  }

  blockApprovers = blockApprovers.filter((a) => a.id !== approverId);
  saveToFile();
}

export function deleteBlock(blockId: string): void {
  const block = blocks.find((b) => b.id === blockId);
  if (!block) {
    throw new Error("Block not found");
  }
  if (!isDraft(block.transactionId)) {
    throw new Error("Blocks can only be deleted in DRAFT status");
  }

  const txBlocks = blocks.filter((b) => b.transactionId === block.transactionId);
  if (txBlocks.length <= 1) {
    throw new Error("Cannot delete the last block");
  }

  // Delete related entities
  const ruleIds = workRules.filter((r) => r.blockId === blockId).map((r) => r.id);
  workRules = workRules.filter((r) => r.blockId !== blockId);
  workItems = workItems.filter((wi) => !ruleIds.includes(wi.workRuleId));
  blockApprovers = blockApprovers.filter((ba) => ba.blockId !== blockId);
  
  // Delete approval policy if not used by other blocks
  const policyUsed = blocks.some((b) => b.approvalPolicyId === block.approvalPolicyId && b.id !== blockId);
  if (!policyUsed) {
    approvalPolicies = approvalPolicies.filter((p) => p.id !== block.approvalPolicyId);
  }

  // Update order indices
  blocks
    .filter((b) => b.transactionId === block.transactionId && b.orderIndex > block.orderIndex)
    .forEach((b) => {
      b.orderIndex -= 1;
    });

  blocks = blocks.filter((b) => b.id !== blockId);
  recalculateTransactionRangeFromBlocks(block.transactionId);
  appendLog(block.transactionId, "ADMIN", "BLOCK_DELETED", { blockId });
  saveToFile();
}

export function reorderBlock(blockId: string, newOrderIndex: number): void {
  const block = blocks.find((b) => b.id === blockId);
  if (!block) {
    throw new Error("Block not found");
  }
  if (!isDraft(block.transactionId)) {
    throw new Error("Blocks can only be reordered in DRAFT status");
  }

  const txBlocks = blocks.filter((b) => b.transactionId === block.transactionId).sort((a, b) => a.orderIndex - b.orderIndex);
  const oldIndex = block.orderIndex;

  if (newOrderIndex < 1 || newOrderIndex > txBlocks.length) {
    throw new Error("Invalid order index");
  }

  // Reorder
  if (newOrderIndex > oldIndex) {
    txBlocks
      .filter((b) => b.orderIndex > oldIndex && b.orderIndex <= newOrderIndex)
      .forEach((b) => {
        b.orderIndex -= 1;
      });
  } else {
    txBlocks
      .filter((b) => b.orderIndex >= newOrderIndex && b.orderIndex < oldIndex)
      .forEach((b) => {
        b.orderIndex += 1;
      });
  }

  block.orderIndex = newOrderIndex;
  appendLog(block.transactionId, "ADMIN", "BLOCK_REORDERED", { blockId, newOrderIndex });
  saveToFile();
}
