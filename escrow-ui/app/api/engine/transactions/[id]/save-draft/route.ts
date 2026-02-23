import { NextResponse } from "next/server";
import * as store from "@/lib/transaction-engine/store";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const transaction = store.saveDraftTransaction(id);
    return NextResponse.json({ ok: true, data: transaction });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to save draft";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
