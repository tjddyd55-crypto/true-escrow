import { NextRequest, NextResponse } from "next/server";
import * as store from "@/lib/transaction-engine/store";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Parse dueDates if string
    let dueDates: number[] = [];
    if (body.dueDates) {
      if (typeof body.dueDates === "string") {
        dueDates = body.dueDates.split(",").map((d: string) => parseInt(d.trim())).filter((n: number) => !isNaN(n));
      } else if (Array.isArray(body.dueDates)) {
        dueDates = body.dueDates;
      }
    }
    
    const rule = store.addWorkRule(body.blockId, {
      workType: body.workType || "CUSTOM",
      title: body.title,
      description: body.description,
      quantity: body.quantity || 1,
      frequency: body.frequency || "ONCE",
      dueDates,
    });
    
    return NextResponse.json({ ok: true, data: rule });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  }
}
