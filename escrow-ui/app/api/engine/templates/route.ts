import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  try {
    const result = await query<{ template_key: string; label_key: string; description_key: string | null; defaults: unknown }>(`
      SELECT template_key, label_key, description_key, defaults
      FROM escrow_templates
      WHERE is_active = true
      ORDER BY created_at ASC
    `);
    return NextResponse.json({ ok: true, data: result.rows });
  } catch (e) {
    console.error("[API] GET /api/engine/templates error:", e);
    return NextResponse.json({ ok: true, data: [] });
  }
}
