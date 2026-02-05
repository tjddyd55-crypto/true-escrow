import { NextRequest, NextResponse } from "next/server";
import * as log from "@/lib/transaction-engine/log";

export async function GET(
  request: NextRequest,
  { params }: { params: { transactionId: string } }
) {
  try {
    const logs = log.listLogs(params.transactionId);
    return NextResponse.json({ ok: true, data: logs });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
