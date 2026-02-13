import { NextRequest, NextResponse } from "next/server";
import * as store from "@/lib/transaction-engine/store";
import { buildExecutionPlanDoc } from "@/lib/execution-plan/buildExecutionPlanDoc";
import { renderExecutionPlanToPdf } from "@/lib/execution-plan/renderExecutionPlanToPdf";
import type { DocLang } from "@/lib/execution-plan/i18nServer";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const langParam = request.nextUrl.searchParams.get("lang") ?? "ko";
    const lang: DocLang = langParam === "en" ? "en" : "ko";
    const transaction = store.getTransaction(id);
    if (!transaction) {
      return NextResponse.json({ ok: false, error: "Transaction not found" }, { status: 404 });
    }

    const blocks = store.getBlocks(id);
    const graph = {
      transaction,
      blocks,
      approvalPolicies: blocks.map((b) => store.getApprovalPolicy(b.approvalPolicyId)).filter(Boolean) as any[],
      blockApprovers: blocks.flatMap((b) => store.getBlockApprovers(b.id)),
      workRules: blocks.flatMap((b) => store.getWorkRules(b.id)),
      workItems: blocks.flatMap((b) => store.getWorkItemsByBlock(b.id)),
    };

    const doc = buildExecutionPlanDoc(graph);
    const pdfBuffer = await renderExecutionPlanToPdf(doc, { lang });

    const filename = `execution-plan-${id}.pdf`;
    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(pdfBuffer.length),
        "Cache-Control": "no-store",
        "Pragma": "no-cache",
      },
    });
  } catch (error: any) {
    console.error("[API] execution-plan.pdf error:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
