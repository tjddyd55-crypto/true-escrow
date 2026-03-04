import { simulateTradeFlow } from "@/lib/trade-mvp/simulateTradeFlow";

async function main() {
  const result = await simulateTradeFlow();
  console.info("[simulateTradeFlow] done:", JSON.stringify(result, null, 2));
}

void main();
