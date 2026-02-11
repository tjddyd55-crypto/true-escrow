import { NextRequest, NextResponse } from "next/server";
import * as store from "@/lib/transaction-engine/store";
import type { TransactionGraph } from "@/lib/transaction-engine/types";
import { query } from "@/lib/db";
import crypto from "crypto";

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
    
    const templateKey = body.template_key ?? body.templateId;
    if (templateKey) {
      // Create from DB template
      const result = await query<{ template_key: string; label: string; defaults: unknown }>(
        "SELECT template_key, label, defaults FROM escrow_templates WHERE template_key = $1 AND is_active = true",
        [templateKey]
      );
      const row = result.rows[0];
      if (!row || !row.defaults) {
        console.error("[API] Template not found:", templateKey);
        return NextResponse.json({ ok: false, error: "Template not found" }, { status: 404 });
      }
      const template = row.defaults as TransactionGraph;
      if (!template.transaction || !template.blocks || !template.approvalPolicies || !template.blockApprovers || !template.workRules) {
        return NextResponse.json({ ok: false, error: "Invalid template defaults" }, { status: 400 });
      }

      const transaction = store.createTransaction({
        title: body.title ?? template.transaction.title,
        description: body.description ?? template.transaction.description,
        initiatorId: body.initiatorId ?? template.transaction.initiatorId ?? "00000000-0000-0000-0000-000000000001",
        initiatorRole: (body.initiatorRole ?? template.transaction.initiatorRole) as "BUYER" | "SELLER",
        buyerId: body.buyerId ?? template.transaction.buyerId,
        sellerId: body.sellerId ?? template.transaction.sellerId,
        startDate: template.transaction.startDate,
        endDate: template.transaction.endDate,
      });

      const policyIdMap = new Map<string, string>();
      const blockIdMap = new Map<string, string>();
      const approverIdMap = new Map<string, string>();
      const ruleIdMap = new Map<string, string>();

      const newPolicies = template.approvalPolicies.map((p) => {
        const newId = crypto.randomUUID();
        policyIdMap.set(p.id, newId);
        return { ...p, id: newId };
      });

      const newBlocks = template.blocks.map((b) => {
        const newId = crypto.randomUUID();
        blockIdMap.set(b.id, newId);
        return {
          ...b,
          id: newId,
          transactionId: transaction.id,
          approvalPolicyId: policyIdMap.get(b.approvalPolicyId) ?? b.approvalPolicyId,
          isActive: false,
        };
      });

      const newApprovers = template.blockApprovers.map((a) => {
        const newId = crypto.randomUUID();
        approverIdMap.set(a.id, newId);
        return {
          ...a,
          id: newId,
          blockId: blockIdMap.get(a.blockId) ?? a.blockId,
        };
      });

      const newWorkRules = template.workRules.map((r) => {
        const newId = crypto.randomUUID();
        ruleIdMap.set(r.id, newId);
        return {
          ...r,
          id: newId,
          blockId: blockIdMap.get(r.blockId) ?? r.blockId,
        };
      });

      const graph = {
        transaction,
        blocks: newBlocks,
        approvalPolicies: newPolicies,
        blockApprovers: newApprovers,
        workRules: newWorkRules,
        workItems: [] as TransactionGraph["workItems"],
      };
      store.saveTransactionGraph(graph);
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
