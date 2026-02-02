import { NextRequest, NextResponse } from "next/server";
import { createLemonCheckout } from "@/lib/lemon";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await context.params; // params는 아직 사용하지 않지만 타입 요구사항을 충족
    const url = await createLemonCheckout();
    return NextResponse.json({ checkoutUrl: url });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message },
      { status: 500 }
    );
  }
}
