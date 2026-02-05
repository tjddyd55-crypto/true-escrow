import { NextRequest, NextResponse } from "next/server";
import * as store from "@/lib/transaction-engine/store";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const item = store.approveWorkItem(params.id);
    return NextResponse.json({ ok: true, data: item });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  }
}
