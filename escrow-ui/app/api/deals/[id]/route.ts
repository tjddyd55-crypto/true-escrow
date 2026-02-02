import { NextResponse } from "next/server";
import { createCheckout } from "@/lib/lemon";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const checkoutUrl = await createCheckout();

    return NextResponse.json({
      id: params.id,
      milestones: [
        {
          id: "m1",
          title: "Deposit",
          amount: 1000,
          status: "PENDING",
          checkoutUrl,
        },
      ],
    });
  } catch (error: any) {
    console.error("API /api/deals/[id] error:", error);

    // ❗ 핵심: 에러여도 JSON은 반드시 내려준다
    // checkoutUrl 없이도 페이지는 표시되도록 함
    return NextResponse.json(
      {
        id: params.id,
        milestones: [
          {
            id: "m1",
            title: "Deposit",
            amount: 1000,
            status: "PENDING",
            checkoutUrl: null,
          },
        ],
        error: "Failed to create checkout",
        message: error?.message ?? "Unknown error",
      },
      { status: 200 } // 200으로 반환하여 페이지는 표시되도록
    );
  }
}
