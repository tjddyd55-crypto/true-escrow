import { NextRequest, NextResponse } from "next/server";
import * as store from "@/lib/transaction-engine/store";

export async function POST(
  request: NextRequest,
  { params }: { params: { blockId: string } }
) {
  try {
    const body = await request.json();
    const result = store.splitBlock(params.blockId, body.splitDay);
    return NextResponse.json({ ok: true, data: result });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  }
}
