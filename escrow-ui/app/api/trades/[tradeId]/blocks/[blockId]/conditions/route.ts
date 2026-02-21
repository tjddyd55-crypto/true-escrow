import { NextRequest, NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/trade-mvp/session";
import { addCondition } from "@/lib/trade-mvp/store";
import type { ConditionType, MvpRole } from "@/lib/trade-mvp/types";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tradeId: string; blockId: string }> }
) {
  try {
    const userId = await getSessionUserId();
    if (!userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const { tradeId, blockId } = await params;
    const body = (await request.json()) as {
      title?: string;
      description?: string;
      type?: ConditionType;
      required?: boolean;
      assignedRole?: MvpRole;
    };
    if (!body.title?.trim() || !body.type || !body.assignedRole) {
      return NextResponse.json(
        { ok: false, error: "title, type, assignedRole are required" },
        { status: 400 }
      );
    }
    const condition = await addCondition({
      tradeId,
      blockId,
      actorUserId: userId,
      title: body.title.trim(),
      description: body.description,
      type: body.type,
      required: Boolean(body.required),
      assignedRole: body.assignedRole,
    });
    return NextResponse.json({ ok: true, data: condition });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Failed to add condition";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
