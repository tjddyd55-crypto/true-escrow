import { NextRequest, NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/trade-mvp/session";
import { listDashboardTransactions } from "@/lib/trade-mvp/store";
import * as engineStore from "@/lib/transaction-engine/store";

type Status = "DRAFT" | "ACTIVE" | "COMPLETED";

function parseStatus(value: string | null): Status {
  if (value === "ACTIVE" || value === "COMPLETED") return value;
  return "DRAFT";
}

export async function GET(request: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const status = parseStatus(request.nextUrl.searchParams.get("status"));
  const mvpItems = await listDashboardTransactions(userId, status);

  const engineItems = engineStore
    .listTransactions()
    .filter((tx) => {
      if (tx.status !== status) return false;
      const createdByMe = tx.initiatorId === userId;
      const participating = tx.buyerId === userId || tx.sellerId === userId;
      if (status === "DRAFT") return createdByMe;
      return createdByMe || participating;
    })
    .map((tx) => ({
      id: tx.id,
      title: tx.title,
      description: tx.description ?? null,
      createdAt: tx.createdAt,
      status: tx.status,
      createdByMe: tx.initiatorId === userId,
      myRole: tx.buyerId === userId ? "BUYER" : tx.sellerId === userId ? "SELLER" : null,
      source: "ENGINE" as const,
    }));

  const merged = [...mvpItems.map((item) => ({ ...item, source: "MVP" as const })), ...engineItems].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt)
  );

  return NextResponse.json({ ok: true, data: merged });
}
