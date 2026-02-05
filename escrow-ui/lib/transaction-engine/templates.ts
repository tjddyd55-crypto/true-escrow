/**
 * Transaction Templates
 */

import type { TransactionGraph } from "./types";

export const templates: Record<string, TransactionGraph> = {
  "marketing-freelance": {
    transaction: {
      id: "template-marketing",
      title: "Marketing Content Package",
      description: "30-day content creation project with weekly blog posts",
      initiatorId: "00000000-0000-0000-0000-000000000001",
      initiatorRole: "BUYER",
      status: "DRAFT",
      createdAt: new Date().toISOString(),
      buyerId: "00000000-0000-0000-0000-000000000001",
      sellerId: "00000000-0000-0000-0000-000000000002",
    },
    blocks: [
      {
        id: "block-1",
        transactionId: "template-marketing",
        title: "Content Creation Phase",
        startDay: 1,
        endDay: 30,
        orderIndex: 1,
        approvalPolicyId: "policy-1",
        isActive: false,
      },
    ],
    approvalPolicies: [
      {
        id: "policy-1",
        type: "SINGLE",
      },
    ],
    blockApprovers: [
      {
        id: "approver-1",
        blockId: "block-1",
        role: "BUYER",
        required: true,
      },
    ],
    workRules: [
      {
        id: "rule-1",
        blockId: "block-1",
        workType: "BLOG",
        description: "Weekly blog post",
        quantity: 2,
        frequency: "WEEKLY",
        dueDates: [7, 14],
      },
    ],
    workItems: [],
  },
  "real-estate": {
    transaction: {
      id: "template-real-estate",
      title: "Real Estate Transaction",
      description: "Property purchase with documents, inspection, and closing",
      initiatorId: "00000000-0000-0000-0000-000000000001",
      initiatorRole: "BUYER",
      status: "DRAFT",
      createdAt: new Date().toISOString(),
      buyerId: "00000000-0000-0000-0000-000000000001",
      sellerId: "00000000-0000-0000-0000-000000000002",
    },
    blocks: [
      {
        id: "block-1",
        transactionId: "template-real-estate",
        title: "Document Review",
        startDay: 1,
        endDay: 7,
        orderIndex: 1,
        approvalPolicyId: "policy-1",
        isActive: false,
      },
      {
        id: "block-2",
        transactionId: "template-real-estate",
        title: "Property Inspection",
        startDay: 8,
        endDay: 14,
        orderIndex: 2,
        approvalPolicyId: "policy-2",
        isActive: false,
      },
      {
        id: "block-3",
        transactionId: "template-real-estate",
        title: "Closing",
        startDay: 15,
        endDay: 21,
        orderIndex: 3,
        approvalPolicyId: "policy-3",
        isActive: false,
      },
    ],
    approvalPolicies: [
      { id: "policy-1", type: "ALL" },
      { id: "policy-2", type: "SINGLE" },
      { id: "policy-3", type: "ALL" },
    ],
    blockApprovers: [
      { id: "approver-1", blockId: "block-1", role: "BUYER", required: true },
      { id: "approver-2", blockId: "block-1", role: "VERIFIER", required: true },
      { id: "approver-3", blockId: "block-2", role: "BUYER", required: true },
      { id: "approver-4", blockId: "block-3", role: "BUYER", required: true },
      { id: "approver-5", blockId: "block-3", role: "SELLER", required: true },
    ],
    workRules: [
      {
        id: "rule-1",
        blockId: "block-1",
        workType: "DOCUMENT",
        description: "Title deed, property tax records",
        quantity: 1,
        frequency: "ONCE",
        dueDates: [7],
      },
      {
        id: "rule-2",
        blockId: "block-2",
        workType: "INSPECTION",
        description: "Property condition inspection",
        quantity: 1,
        frequency: "ONCE",
        dueDates: [14],
      },
      {
        id: "rule-3",
        blockId: "block-3",
        workType: "DOCUMENT",
        description: "Closing documents",
        quantity: 1,
        frequency: "ONCE",
        dueDates: [21],
      },
    ],
    workItems: [],
  },
  "vehicle": {
    transaction: {
      id: "template-vehicle",
      title: "Vehicle Purchase",
      description: "Vehicle inspection and title transfer",
      initiatorId: "00000000-0000-0000-0000-000000000001",
      initiatorRole: "BUYER",
      status: "DRAFT",
      createdAt: new Date().toISOString(),
      buyerId: "00000000-0000-0000-0000-000000000001",
      sellerId: "00000000-0000-0000-0000-000000000002",
    },
    blocks: [
      {
        id: "block-1",
        transactionId: "template-vehicle",
        title: "Vehicle Inspection",
        startDay: 1,
        endDay: 5,
        orderIndex: 1,
        approvalPolicyId: "policy-1",
        isActive: false,
      },
      {
        id: "block-2",
        transactionId: "template-vehicle",
        title: "Title Transfer",
        startDay: 6,
        endDay: 10,
        orderIndex: 2,
        approvalPolicyId: "policy-2",
        isActive: false,
      },
    ],
    approvalPolicies: [
      { id: "policy-1", type: "SINGLE" },
      { id: "policy-2", type: "ALL" },
    ],
    blockApprovers: [
      { id: "approver-1", blockId: "block-1", role: "BUYER", required: true },
      { id: "approver-2", blockId: "block-2", role: "BUYER", required: true },
      { id: "approver-3", blockId: "block-2", role: "SELLER", required: true },
    ],
    workRules: [
      {
        id: "rule-1",
        blockId: "block-1",
        workType: "INSPECTION",
        description: "Vehicle condition and mechanical inspection",
        quantity: 1,
        frequency: "ONCE",
        dueDates: [5],
      },
      {
        id: "rule-2",
        blockId: "block-2",
        workType: "DOCUMENT",
        description: "Title transfer documents",
        quantity: 1,
        frequency: "ONCE",
        dueDates: [10],
      },
    ],
    workItems: [],
  },
};

export function getTemplate(id: string): TransactionGraph | undefined {
  return templates[id];
}

export function listTemplates(): Array<{ id: string; title: string; description: string }> {
  return [
    {
      id: "marketing-freelance",
      title: "Marketing / Freelance",
      description: "30-day content creation project with weekly blog posts",
    },
    {
      id: "real-estate",
      title: "Real Estate",
      description: "Property purchase with documents, inspection, and closing",
    },
    {
      id: "vehicle",
      title: "Vehicle",
      description: "Vehicle inspection and title transfer",
    },
  ];
}
