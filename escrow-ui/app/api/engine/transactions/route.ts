import { NextRequest, NextResponse } from "next/server";
import * as store from "@/lib/transaction-engine/store";
import type { TransactionGraph } from "@/lib/transaction-engine/types";
import { query } from "@/lib/db";
import { templateSpecSchema } from "@/lib/template-spec.schema";
import { buildTransactionFromTemplateSpec } from "@/lib/build-transaction-from-spec";
import { addDays } from "@/lib/transaction-engine/dateUtils";

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
      console.log("=== TEMPLATE FETCH START ===");

      const { rows } = await query<{ template_key: string; defaults: unknown }>(
        "SELECT template_key, defaults FROM escrow_templates WHERE template_key = $1 AND is_active = true",
        [templateKey]
      );

      console.log("Template row:", rows[0]);

      if (!rows.length) {
        console.log("Template not found");
        return NextResponse.json({ ok: false, error: "Template not found" }, { status: 404 });
      }

      console.log("Raw defaults:", rows[0].defaults);

      const parsed = templateSpecSchema.safeParse(rows[0].defaults);
      console.log("Parse result:", parsed.success ? "success" : "failure", parsed.success ? undefined : parsed.error?.issues);

      if (!parsed.success) {
        console.log("Zod issues:", parsed.error?.issues);
        return NextResponse.json({ ok: false, error: "TemplateSpec validation failed" }, { status: 400 });
      }

      const today = new Date().toISOString().slice(0, 10);
      const defaultEnd = addDays(today, 30);
      const graph = buildTransactionFromTemplateSpec(parsed.data, {
        title: body.title ?? "New Transaction",
        description: body.description,
        initiatorId: body.initiatorId ?? "00000000-0000-0000-0000-000000000001",
        initiatorRole: (body.initiatorRole ?? "BUYER") as "BUYER" | "SELLER",
        buyerId: body.buyerId,
        sellerId: body.sellerId,
        startDate: body.startDate ?? today,
        endDate: body.endDate ?? defaultEnd,
      });

      store.saveTransactionGraph(graph);
      return NextResponse.json({ ok: true, data: graph.transaction });
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
