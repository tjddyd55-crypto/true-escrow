import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  // Deal 정보만 반환 (checkout은 별도 POST 엔드포인트로 분리)
  const { id } = await context.params;
  return NextResponse.json({
    id,
    milestones: [
      {
        id: "m1",
        title: "Deposit",
        amount: 1000,
        status: "PENDING",
      },
    ],
  });
}
