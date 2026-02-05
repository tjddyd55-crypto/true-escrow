import { NextResponse } from "next/server";
import * as templates from "@/lib/transaction-engine/templates";

export async function GET() {
  try {
    const list = templates.listTemplates();
    return NextResponse.json({ ok: true, data: list });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
