import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export type EscrowTemplateRow = {
  template_key: string;
  label_key: string;
  description_key: string | null;
  defaults: Record<string, unknown>;
};

export async function GET() {
  try {
    // [DEBUG] 운영 서버 DB 연결 확인용 – 확인 후 제거
    console.log("[DEBUG] DATABASE_URL:", process.env.DATABASE_URL ? "[set]" : "[not set]");

    const debugResult = await query<{ db: string; schema: string; template_count: string }>(`
      SELECT current_database() AS db,
             current_schema() AS schema,
             count(*)::text AS template_count
      FROM escrow_templates
    `);
    console.log("[DEBUG] DB DEBUG:", debugResult.rows);

    const result = await query<EscrowTemplateRow>(`
      SELECT template_key, label_key, description_key, defaults
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
