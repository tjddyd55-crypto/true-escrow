import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  // Deal 정보만 반환 (checkout은 별도 POST 엔드포인트로 분리)
  return NextResponse.json({
    id: params.id,
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
