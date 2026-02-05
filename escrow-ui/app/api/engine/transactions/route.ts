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
    
    if (body.templateId) {
      // Create from template
      const template = templates.getTemplate(body.templateId);
      if (!template) {
        return NextResponse.json({ ok: false, error: "Template not found" }, { status: 404 });
      }
      
      // Override with provided values
      const transaction = store.createTransaction({
        title: body.title || template.transaction.title,
        description: body.description || template.transaction.description,
        initiatorId: body.initiatorId || "00000000-0000-0000-0000-000000000001",
        initiatorRole: body.initiatorRole || template.transaction.initiatorRole,
        buyerId: body.buyerId || template.transaction.buyerId,
        sellerId: body.sellerId || template.transaction.sellerId,
      });
      
      // Save template graph with new transaction ID
      const graph = {
        ...template,
        transaction: { ...template.transaction, id: transaction.id },
      };
      graph.blocks = graph.blocks.map((b) => ({ ...b, transactionId: transaction.id }));
      graph.approvalPolicies.forEach((p) => {
        graph.blocks.forEach((b) => {
          if (b.approvalPolicyId === p.id) {
            // Keep same policy ID
          }
        });
      });
      
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
      
      return NextResponse.json({ ok: true, data: transaction });
    }
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
