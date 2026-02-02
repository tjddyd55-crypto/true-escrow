import { NextResponse } from "next/server";
import { createLemonCheckout } from "@/lib/lemon";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const url = await createLemonCheckout();
    return NextResponse.json({ checkoutUrl: url });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message },
      { status: 500 }
    );
  }
}
