import { NextResponse } from "next/server";
import { isDatabaseConfigured, query } from "@/lib/db";
import { BUILT_IN_TEMPLATES } from "@/lib/templates/builtInTemplates";

export type EscrowTemplateRow = {
  template_key: string;
  label_key: string;
  description_key: string | null;
  defaults: Record<string, unknown>;
};

export async function GET() {
  try {
    if (!isDatabaseConfigured()) {
      return NextResponse.json({ ok: true, data: BUILT_IN_TEMPLATES });
    }

    const result = await query<EscrowTemplateRow>(`
      SELECT template_key, label_key, description_key, defaults
      FROM escrow_templates
      WHERE is_active = true
      ORDER BY created_at ASC
    `);
    const rows = result.rows.length > 0 ? result.rows : BUILT_IN_TEMPLATES;
    return NextResponse.json({ ok: true, data: rows });
  } catch (e) {
    console.error("[API] GET /api/escrow/templates error:", e);
    return NextResponse.json({ ok: true, data: BUILT_IN_TEMPLATES });
  }
}
