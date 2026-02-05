import { NextRequest, NextResponse } from "next/server";
import * as store from "@/lib/transaction-engine/store";

export async function POST(
  request: NextRequest,
  { params }: { params: { blockId: string } }
) {
  try {
    const block = store.approveBlock(params.blockId);
    return NextResponse.json({ ok: true, data: block });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  }
}
