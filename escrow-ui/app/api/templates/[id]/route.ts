import { NextResponse } from "next/server";
import { isDatabaseConfigured, query } from "@/lib/db";
import { getOrCreateOwnerKey, applyOwnerCookie } from "@/lib/templates/ownerKey";
import * as inMemoryUserTemplates from "@/lib/templates/inMemoryUserTemplates";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { ownerKey, shouldSetCookie } = await getOrCreateOwnerKey();
    let row: Record<string, unknown> | null = null;

    if (isDatabaseConfigured()) {
      row =
        (
          await query<Record<string, unknown>>(
            `SELECT id, owner_user_id, title, description, source_trade_id, template_json, created_at, updated_at
             FROM escrow_user_templates
             WHERE id = $1 AND owner_user_id = $2`,
            [id, ownerKey]
          )
        ).rows[0] ?? null;
    } else {
      const inMemory = inMemoryUserTemplates.getUserTemplate(id);
      row = inMemory?.owner_user_id === ownerKey ? inMemory : null;
    }

    if (!row) return NextResponse.json({ ok: false, error: "Template not found" }, { status: 404 });
    const res = NextResponse.json({ ok: true, data: row });
    return shouldSetCookie ? applyOwnerCookie(res, ownerKey) : res;
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Failed to load template";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
