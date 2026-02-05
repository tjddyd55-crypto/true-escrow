import { NextRequest, NextResponse } from "next/server";
import * as store from "@/lib/transaction-engine/store";
import * as templates from "@/lib/transaction-engine/templates";

export async function GET() {
  try {
    const transactions = store.listTransactions();
    return NextResponse.json({ ok: true, data: transactions });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("[API] POST /api/engine/transactions", { body });
    
    if (body.templateId) {
      // Create from template
      const template = templates.getTemplate(body.templateId);
      if (!template) {
        console.error("[API] Template not found:", body.templateId);
        return NextResponse.json({ ok: false, error: "Template not found" }, { status: 404 });
      }
      
      // Create new transaction
      const transaction = store.createTransaction({
        title: body.title || template.transaction.title,
        description: body.description || template.transaction.description,
        initiatorId: body.initiatorId || "00000000-0000-0000-0000-000000000001",
        initiatorRole: body.initiatorRole || template.transaction.initiatorRole,
        buyerId: body.buyerId || template.transaction.buyerId,
        sellerId: body.sellerId || template.transaction.sellerId,
      });
      
      console.log("[API] Created transaction:", transaction.id);
      
      // Generate new IDs for all entities and update references
      const policyIdMap = new Map<string, string>();
      const blockIdMap = new Map<string, string>();
      const approverIdMap = new Map<string, string>();
      const ruleIdMap = new Map<string, string>();
      
      // Create new approval policies
      const newPolicies = template.approvalPolicies.map((p) => {
        const newId = `policy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        policyIdMap.set(p.id, newId);
        return {
          ...p,
          id: newId,
        };
      });
      
      // Create new blocks
      const newBlocks = template.blocks.map((b) => {
        const newId = `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        blockIdMap.set(b.id, newId);
        return {
          ...b,
          id: newId,
          transactionId: transaction.id,
          approvalPolicyId: policyIdMap.get(b.approvalPolicyId) || b.approvalPolicyId,
          isActive: false,
        };
      });
      
      // Create new approvers
      const newApprovers = template.blockApprovers.map((a) => {
        const newId = `approver-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        approverIdMap.set(a.id, newId);
        return {
          ...a,
          id: newId,
          blockId: blockIdMap.get(a.blockId) || a.blockId,
        };
      });
      
      // Create new work rules
      const newWorkRules = template.workRules.map((r) => {
        const newId = `rule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        ruleIdMap.set(r.id, newId);
        return {
          ...r,
          id: newId,
          blockId: blockIdMap.get(r.blockId) || r.blockId,
        };
      });
      
      // Create graph with new transaction
      const graph = {
        transaction,
        blocks: newBlocks,
        approvalPolicies: newPolicies,
        blockApprovers: newApprovers,
        workRules: newWorkRules,
        workItems: [], // No work items in DRAFT
      };
      
      console.log("[API] Saving transaction graph:", transaction.id);
      store.saveTransactionGraph(graph);
      console.log("[API] Transaction graph saved successfully");
      
      return NextResponse.json({ ok: true, data: transaction });
    } else {
      // Create blank transaction
      const transaction = store.createTransaction({
        title: body.title,
        description: body.description,
        initiatorId: body.initiatorId || "00000000-0000-0000-0000-000000000001",
        initiatorRole: body.initiatorRole || "BUYER",
        buyerId: body.buyerId,
        sellerId: body.sellerId,
      });
      
      console.log("[API] Created blank transaction:", transaction.id);
      
      // Save empty graph
      const graph = {
        transaction,
        blocks: [],
        approvalPolicies: [],
        blockApprovers: [],
        workRules: [],
        workItems: [],
      };
      store.saveTransactionGraph(graph);
      
      return NextResponse.json({ ok: true, data: transaction });
    }
  } catch (error: any) {
    console.error("[API] Error creating transaction:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
