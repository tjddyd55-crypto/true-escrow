import { processEmailQueue } from "@/lib/trade-mvp/store";

async function main() {
  const result = await processEmailQueue(100);
  console.info("[processEmailQueue] processed:", result.processed);
}

void main();
