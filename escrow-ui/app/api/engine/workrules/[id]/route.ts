import { NextRequest, NextResponse } from "next/server";
import * as store from "@/lib/transaction-engine/store";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    
    // Parse dueDates if string
    if (body.dueDates && typeof body.dueDates === "string") {
      body.dueDates = body.dueDates.split(",").map((d: string) => parseInt(d.trim())).filter((n: number) => !isNaN(n));
    }
    
    const rule = store.updateWorkRule(params.id, body);
    return NextResponse.json({ ok: true, data: rule });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    store.deleteWorkRule(params.id);
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  }
}
