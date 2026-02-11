import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export type EscrowTemplateRow = {
  template_key: string;
  label: string;
  defaults: Record<string, unknown>;
};

export async function GET() {
  try {
    const result = await query<EscrowTemplateRow>(`
      SELECT template_key, label, defaults
      FROM escrow_templates
      WHERE is_active = true
      ORDER BY created_at ASC
    `);
    return NextResponse.json({ ok: true, data: result.rows });
  } catch (e) {
    console.error("[API] GET /api/escrow/templates error:", e);
    return NextResponse.json({ ok: true, data: [] });
  }
}
