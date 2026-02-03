import { NextRequest, NextResponse } from "next/server";
import { createLemonCheckout } from "@/lib/lemon";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: dealId } = await context.params;
    
    // Request body에서 milestoneId 추출 (옵셔널)
    let milestoneId: string | undefined;
    try {
      const body = await request.json();
      milestoneId = body.milestoneId;
    } catch {
      // Request body가 없거나 JSON이 아닌 경우 무시
    }
    
    const url = await createLemonCheckout(dealId, milestoneId);
    return NextResponse.json({ checkoutUrl: url });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message },
      { status: 500 }
    );
  }
}
