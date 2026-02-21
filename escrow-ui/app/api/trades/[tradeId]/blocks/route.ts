import { NextRequest, NextResponse } from "next/server";
import { createBlock } from "@/lib/trade-mvp/store";
import { getSessionUserId } from "@/lib/trade-mvp/session";
import type { MvpRole } from "@/lib/trade-mvp/types";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tradeId: string }> }
) {
  try {
    const userId = await getSessionUserId();
    if (!userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const { tradeId } = await params;
    const body = (await request.json()) as {
      title?: string;
      startDate?: string | null;
      dueDate?: string;
      approvalType?: "MANUAL" | "SIMPLE";
      finalApproverRole?: MvpRole;
      watchers?: MvpRole[];
    };
    if (!body.title?.trim() || !body.dueDate || !body.finalApproverRole) {
      return NextResponse.json(
        { ok: false, error: "title, dueDate, finalApproverRole are required" },
        { status: 400 }
      );
    }
    const block = await createBlock({
      tradeId,
      actorUserId: userId,
      title: body.title.trim(),
      startDate: body.startDate ?? null,
      dueDate: body.dueDate,
      approvalType: body.approvalType ?? "MANUAL",
      finalApproverRole: body.finalApproverRole,
      watchers: body.watchers ?? [],
    });
    return NextResponse.json({ ok: true, data: block });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Failed to create block";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
