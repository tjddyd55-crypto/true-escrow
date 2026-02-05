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
import fs from "fs";
import path from "path";

// In-memory store
let transactions: Transaction[] = [];
let blocks: Block[] = [];
let approvalPolicies: ApprovalPolicy[] = [];
let blockApprovers: BlockApprover[] = [];
let workRules: WorkRule[] = [];
let workItems: WorkItem[] = [];

const DATA_FILE = path.join(process.cwd(), ".data", "transaction-engine.json");

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
        workRules,
        workItems,
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

// Helper functions
function generateId(): string {
  return `id-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function findTransaction(id: string): Transaction | undefined {
  return transactions.find((t) => t.id === id);
}

function isDraft(transactionId: string): boolean {
  const tx = findTransaction(transactionId);
  return tx?.status === "DRAFT";
}

// CRUD Operations

export function createTransaction(payload: {
  title: string;
  description?: string;
  initiatorId: string;
  initiatorRole: "BUYER" | "SELLER";
  buyerId?: string;
  sellerId?: string;
}): Transaction {
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
  };
  transactions.push(transaction);
  appendLog(transaction.id, "ADMIN", "TRANSACTION_CREATED", { title: payload.title });
  saveToFile();
  return transaction;
}

export function getTransaction(id: string): Transaction | undefined {
  return transactions.find((t) => t.id === id);
}

export function listTransactions(): Transaction[] {
  return [...transactions];
}

export function saveTransactionGraph(graph: TransactionGraph): void {
  // Update or insert transaction
  const txIndex = transactions.findIndex((t) => t.id === graph.transaction.id);
  if (txIndex >= 0) {
    transactions[txIndex] = graph.transaction;
  } else {
    transactions.push(graph.transaction);
  }

  // Replace all related entities
  blocks = blocks.filter((b) => b.transactionId !== graph.transaction.id);
  blocks.push(...graph.blocks);

  const blockIds = graph.blocks.map((b) => b.id);
  approvalPolicies = approvalPolicies.filter((p) => 
    graph.approvalPolicies.some((ap) => ap.id === p.id)
  );
  approvalPolicies.push(...graph.approvalPolicies);

  blockApprovers = blockApprovers.filter((ba) => blockIds.includes(ba.blockId));
  blockApprovers.push(...graph.blockApprovers);

  workRules = workRules.filter((wr) => blockIds.includes(wr.blockId));
  workRules.push(...graph.workRules);

  workItems = workItems.filter((wi) => {
    const workRule = workRules.find((wr) => wr.id === wi.workRuleId);
    return workRule && blockIds.includes(workRule.blockId);
  });
  workItems.push(...graph.workItems);

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
    generateWorkItemsForBlock(firstBlock.id);
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

  Object.assign(block, patch);
  saveToFile();
  return block;
}

export function addBlock(transactionId: string, block: Omit<Block, "id" | "transactionId" | "isActive">): Block {
  if (!isDraft(transactionId)) {
    throw new Error("Blocks can only be added in DRAFT status");
  }

  const newBlock: Block = {
    ...block,
    id: generateId(),
    transactionId,
    isActive: false,
  };
  blocks.push(newBlock);
  appendLog(transactionId, "ADMIN", "BLOCK_ADDED", { blockId: newBlock.id });
  saveToFile();
  return newBlock;
}

export function splitBlock(blockId: string, splitDay: number): { block1: Block; block2: Block } {
  const block = blocks.find((b) => b.id === blockId);
  if (!block) {
    throw new Error("Block not found");
  }
  if (!isDraft(block.transactionId)) {
    throw new Error("Block can only be split in DRAFT status");
  }
  if (splitDay <= block.startDay || splitDay >= block.endDay) {
    throw new Error("Split day must be within block period");
  }

  // Create two blocks
  const block1: Block = {
    ...block,
    id: generateId(),
    endDay: splitDay - 1,
  };
  const block2: Block = {
    ...block,
    id: generateId(),
    startDay: splitDay,
    orderIndex: block.orderIndex + 1,
  };

  // Update subsequent blocks' orderIndex
  blocks
    .filter((b) => b.transactionId === block.transactionId && b.orderIndex > block.orderIndex)
    .forEach((b) => {
      b.orderIndex += 1;
    });

  // Replace original block with block1, add block2
  const blockIndex = blocks.findIndex((b) => b.id === blockId);
  blocks[blockIndex] = block1;
  blocks.push(block2);

  // Move work rules to block1 (in real implementation, might need to split)
  workRules
    .filter((wr) => wr.blockId === blockId)
    .forEach((wr) => {
      wr.blockId = block1.id;
    });

  appendLog(block.transactionId, "ADMIN", "BLOCK_SPLIT", { blockId, splitDay });
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
  appendLog(block.transactionId, "ADMIN", "WORK_RULE_DELETED", { workRuleId });
  saveToFile();
}

export function generateWorkItemsForBlock(blockId: string): WorkItem[] {
  const block = blocks.find((b) => b.id === blockId);
  if (!block) {
    throw new Error("Block not found");
  }

  const rules = workRules.filter((r) => r.blockId === blockId);
  const newItems: WorkItem[] = [];

  for (const rule of rules) {
    const dueDays = calculateDueDays(rule, block);
    
    for (const dueDay of dueDays) {
      // Check if item already exists
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

function calculateDueDays(rule: WorkRule, block: Block): number[] {
  if (rule.dueDates && rule.dueDates.length > 0) {
    return rule.dueDates.slice(0, rule.quantity);
  }

  const days: number[] = [];
  switch (rule.frequency) {
    case "ONCE":
      days.push(block.endDay);
      break;
    case "DAILY":
      for (let day = block.startDay; day <= block.endDay && days.length < rule.quantity; day++) {
        days.push(day);
      }
      break;
    case "WEEKLY":
      for (let day = block.startDay; day <= block.endDay && days.length < rule.quantity; day += 7) {
        days.push(day);
      }
      break;
    case "CUSTOM":
      days.push(block.endDay);
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

export function approveBlock(blockId: string): Block {
  const block = blocks.find((b) => b.id === blockId);
  if (!block) {
    throw new Error("Block not found");
  }
  if (!block.isActive) {
    throw new Error("Only active blocks can be approved");
  }

  // Check if all work items are approved
  const ruleIds = workRules.filter((r) => r.blockId === blockId).map((r) => r.id);
  const items = workItems.filter((wi) => ruleIds.includes(wi.workRuleId));
  const allApproved = items.length > 0 && items.every((i) => i.status === "APPROVED");
  
  if (!allApproved) {
    throw new Error("All work items must be approved before block approval");
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
    generateWorkItemsForBlock(nextBlock.id);
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
