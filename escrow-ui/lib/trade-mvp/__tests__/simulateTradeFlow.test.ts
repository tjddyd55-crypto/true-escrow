import { describe, expect, it } from "vitest";
import { processEmailQueue } from "@/lib/trade-mvp/store";
import { simulateTradeFlow } from "@/lib/trade-mvp/simulateTradeFlow";

describe("simulateTradeFlow", () => {
  it("생성된 이벤트/알림/이메일 큐를 검증한다", async () => {
    const result = await simulateTradeFlow();
    expect(result.eventsCount).toBeGreaterThanOrEqual(8);
    expect(result.notificationCountByUser.seller).toBeGreaterThan(0);
    expect(result.notificationCountByUser.buyer).toBeGreaterThan(0);
    expect(result.emailQueue.pending).toBeGreaterThan(0);

    const worker = await processEmailQueue(50);
    expect(worker.processed).toBeGreaterThan(0);
  });
});
